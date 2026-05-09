-- =========================================================================
-- Migration : système de parrainage (referral).
--
-- - Chaque profil reçoit un `referral_code` unique (8 caractères, casse mixte).
-- - `referred_by` stocke l'id du parrain qui a fait venir l'utilisateur.
-- - Une vue agrégée permet de compter les filleuls actifs par parrain.
--
-- Backward-compatible : les colonnes sont nullable, l'auto-génération
-- du code se fait via trigger BEFORE INSERT (et seulement si NULL).
-- =========================================================================

-- 1) Colonnes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_credit_days int NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.referral_code         IS 'Code unique partageable (ex: ZK8FA2B1).';
COMMENT ON COLUMN profiles.referred_by           IS 'UUID du parrain — null si l''utilisateur n''est pas filleul.';
COMMENT ON COLUMN profiles.referral_credit_days  IS 'Jours de premium offerts cumulés via le parrainage.';

CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles (referral_code);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx   ON profiles (referred_by);

-- 2) Fonction de génération du code (préfixe 'ZK' + 6 chars base36)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  exists_code boolean;
BEGIN
  LOOP
    -- 6 caractères alphanumériques en base36, en majuscules
    candidate := 'ZK' || upper(substring(md5(random()::text || clock_timestamp()::text) for 6));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = candidate) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 3) Trigger : auto-génère le code si absent à l'insertion
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

-- 4) Backfill : on remplit les profils existants qui n'ont pas encore de code
UPDATE profiles
SET    referral_code = generate_referral_code()
WHERE  referral_code IS NULL;

-- 5) Vue d'agrégation pour le tableau de bord parrainage
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
