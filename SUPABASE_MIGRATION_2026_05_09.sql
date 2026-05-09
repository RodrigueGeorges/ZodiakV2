-- =========================================================================
--  ZODIAK · MIGRATION CONSOLIDÉE · 9 mai 2026
--  À exécuter dans Supabase SQL Editor (un seul run).
--
--  Contenu :
--    1) daily_guidance : ajout money / mantra / dos / donts
--    2) profiles : système de parrainage (referral_code / referred_by / credit)
--    3) smart_push_log : table de dédup pour les pushs contextuels
--
--  Toutes les opérations sont idempotentes (IF NOT EXISTS / CREATE OR REPLACE).
--  Tu peux relancer ce script sans risque.
-- =========================================================================


-- =========================================================================
-- 1) GUIDANCE ÉTENDUE : money + mantra + dos / donts
-- =========================================================================

ALTER TABLE daily_guidance
  ADD COLUMN IF NOT EXISTS money  text,
  ADD COLUMN IF NOT EXISTS mantra text,
  ADD COLUMN IF NOT EXISTS dos    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS donts  jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN daily_guidance.money  IS '4ème pilier optionnel — finances. Null pour les guidances pré-migration.';
COMMENT ON COLUMN daily_guidance.mantra IS 'Phrase courte personnalisée préfixée du prénom de l''utilisateur.';
COMMENT ON COLUMN daily_guidance.dos    IS 'Tableau JSON de 3 actions à privilégier (≤ 12 mots chacune).';
COMMENT ON COLUMN daily_guidance.donts  IS 'Tableau JSON de 3 actions à éviter (≤ 12 mots chacune).';


-- =========================================================================
-- 2) SYSTÈME DE PARRAINAGE
-- =========================================================================

-- 2.a Colonnes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code        text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_credit_days int NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.referral_code        IS 'Code unique partageable (ex: ZK8FA2B1).';
COMMENT ON COLUMN profiles.referred_by          IS 'UUID du parrain — null si l''utilisateur n''est pas filleul.';
COMMENT ON COLUMN profiles.referral_credit_days IS 'Jours de premium offerts cumulés via le parrainage.';

CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles (referral_code);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx   ON profiles (referred_by);

-- 2.b Fonction génératrice de code (préfixe ZK + 6 chars hex)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate   text;
  exists_code boolean;
BEGIN
  LOOP
    candidate := 'ZK' || upper(substring(md5(random()::text || clock_timestamp()::text) for 6));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = candidate) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 2.c Trigger d'auto-génération à l'insertion
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR length(NEW.referral_code) = 0 THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON profiles;
CREATE TRIGGER profiles_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_referral_code();

-- 2.d Backfill des profils existants (génère un code pour ceux qui n'en ont pas)
UPDATE profiles
SET    referral_code = generate_referral_code()
WHERE  referral_code IS NULL;

-- 2.e Vue d'agrégation pour le tableau de bord parrainage
CREATE OR REPLACE VIEW referral_stats AS
SELECT
  p.id                     AS user_id,
  p.referral_code,
  COUNT(child.id)::int     AS referred_count,
  COUNT(child.id) FILTER (WHERE child.subscription_status IN ('active','trial'))::int AS referred_active_count,
  p.referral_credit_days
FROM profiles p
LEFT JOIN profiles child ON child.referred_by = p.id
GROUP BY p.id, p.referral_code, p.referral_credit_days;

COMMENT ON VIEW referral_stats IS 'Statistiques de parrainage par utilisateur.';


-- =========================================================================
-- 3) RPC PUBLIQUE — résolution d'un code parrainage par un user anonyme
--
-- Quand quelqu'un arrive sur /r/CODE, il n'est PAS encore connecté.
-- Un SELECT direct sur `profiles` est bloqué par la RLS owner-only.
-- On expose donc une fonction SECURITY DEFINER qui retourne UNIQUEMENT
-- l'uuid du parrain (rien d'autre — pas de fuite d'info).
-- =========================================================================

CREATE OR REPLACE FUNCTION find_inviter_by_code(code text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
-- Le search_path explicite empêche les attaques de hijacking de fonction.
SET search_path = public, pg_temp
AS $$
  SELECT id
  FROM profiles
  WHERE referral_code = upper(trim(code))
  LIMIT 1;
$$;

COMMENT ON FUNCTION find_inviter_by_code(text)
  IS 'Résout un code parrainage en uuid de parrain. Lisible par anon + authenticated.';

-- Autorise anon ET authenticated à appeler cette RPC, rien d'autre.
REVOKE ALL ON FUNCTION find_inviter_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_inviter_by_code(text) TO anon, authenticated;


-- =========================================================================
-- 4) SMART PUSH LOG (dédup des push contextuels) + RLS
-- =========================================================================

CREATE TABLE IF NOT EXISTS smart_push_log (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug      text NOT NULL,
  sent_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS smart_push_log_slug_idx ON smart_push_log (slug);
CREATE INDEX IF NOT EXISTS smart_push_log_user_idx ON smart_push_log (user_id);

COMMENT ON TABLE  smart_push_log      IS 'Log des smart push contextuels envoyés (dédup serveur).';
COMMENT ON COLUMN smart_push_log.slug IS 'Identifiant unique du moment (ex: full_moon_2026-05-12).';

-- 4.a Activation RLS
ALTER TABLE smart_push_log ENABLE ROW LEVEL SECURITY;

-- 4.b Policies : un user ne voit / ne supprime QUE ses propres logs.
-- Les écritures (INSERT/UPDATE) sont faites par la fonction Netlify cron
-- avec la SERVICE_ROLE_KEY, qui bypass naturellement la RLS — donc
-- AUCUNE policy d'insert n'est nécessaire (et c'est plus secure).
DROP POLICY IF EXISTS "smart_push_log_owner_select" ON smart_push_log;
CREATE POLICY "smart_push_log_owner_select" ON smart_push_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "smart_push_log_owner_delete" ON smart_push_log;
CREATE POLICY "smart_push_log_owner_delete" ON smart_push_log
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- =========================================================================
-- 5) PERMISSIONS sur la vue referral_stats
--    La vue hérite de la RLS de `profiles` mais on doit explicitement
--    donner le SELECT au rôle authenticated (anon n'en a pas besoin).
-- =========================================================================

GRANT SELECT ON referral_stats TO authenticated;


-- =========================================================================
-- 6) VÉRIFICATION POST-MIGRATION (aucune écriture, juste un SELECT de contrôle)
--    Si tout s'affiche avec les bonnes valeurs, la migration est OK.
-- =========================================================================

SELECT
  -- Doit retourner 4 colonnes ajoutées sur daily_guidance
  (SELECT count(*)::int FROM information_schema.columns
   WHERE table_name = 'daily_guidance' AND column_name IN ('money','mantra','dos','donts')) AS daily_guidance_cols_added,

  -- Doit retourner 3 colonnes ajoutées sur profiles
  (SELECT count(*)::int FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name IN ('referral_code','referred_by','referral_credit_days')) AS profiles_cols_added,

  -- Doit retourner 1 (la table existe)
  (SELECT count(*)::int FROM information_schema.tables
   WHERE table_name = 'smart_push_log') AS smart_push_log_exists,

  -- Doit retourner 1 (RLS bien activée)
  (SELECT relrowsecurity::int FROM pg_class WHERE relname = 'smart_push_log') AS smart_push_log_rls_on,

  -- Doit retourner 1 (la fonction RPC existe et est exécutable par anon)
  (SELECT count(*)::int FROM pg_proc WHERE proname = 'find_inviter_by_code') AS rpc_exists,

  -- Tous les profils existants ont bien un code (doit être 0)
  (SELECT count(*)::int FROM profiles WHERE referral_code IS NULL) AS profiles_without_code;
