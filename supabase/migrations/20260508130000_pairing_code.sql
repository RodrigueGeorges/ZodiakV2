-- =============================================================================
-- Sprint 2.A — Système de jumelage par code à 6 chiffres
-- =============================================================================
-- Permet à un user de connecter son canal WhatsApp/Instagram en envoyant
-- un code à 6 chiffres en DM. C'est plus robuste que le matching par
-- mots-clés `START` (qui suppose que le webhook reçoit déjà un user identifié,
-- ce qui n'est jamais le cas au premier contact).
--
-- Flux :
--   1. UI génère un code 6 chiffres pour l'utilisateur connecté → stocke dans
--      `channel_pairing_codes` (expire en 15min, max 1 actif par user).
--   2. UI affiche "Envoie le code 123456 à @zodiak en DM WhatsApp/Instagram".
--   3. Webhook Meta reçoit le DM → cherche le code → lie `wa_id` ou `igsid`
--      au profil + active la guidance.
-- =============================================================================

CREATE TABLE IF NOT EXISTS channel_pairing_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT  channel_pairing_codes_code_unique UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS channel_pairing_codes_user_id_idx
  ON channel_pairing_codes (user_id);
CREATE INDEX IF NOT EXISTS channel_pairing_codes_active_idx
  ON channel_pairing_codes (code)
  WHERE consumed_at IS NULL;

ALTER TABLE channel_pairing_codes ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut lire/écrire SES codes (pour génération via UI)
CREATE POLICY "channel_pairing_codes_owner_all"
  ON channel_pairing_codes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role : tout (consommation depuis le webhook)
CREATE POLICY "channel_pairing_codes_service_all"
  ON channel_pairing_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper : générer un nouveau code unique pour un user (invalide les
-- précédents non consommés du même user, expire en 15 min)
CREATE OR REPLACE FUNCTION generate_pairing_code(p_user_id UUID)
RETURNS VARCHAR(6)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code VARCHAR(6);
  v_attempt INT := 0;
BEGIN
  -- Annuler les codes précédents non consommés du même user
  UPDATE channel_pairing_codes
     SET consumed_at = NOW()
   WHERE user_id = p_user_id
     AND consumed_at IS NULL;

  LOOP
    v_attempt := v_attempt + 1;
    -- 6 chiffres random (zéro-padded)
    v_code := lpad((floor(random() * 1000000))::text, 6, '0');

    BEGIN
      INSERT INTO channel_pairing_codes (user_id, code, expires_at)
      VALUES (p_user_id, v_code, NOW() + INTERVAL '15 minutes');
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt > 10 THEN
        RAISE EXCEPTION 'Impossible de générer un code unique après 10 tentatives';
      END IF;
    END;
  END LOOP;
END;
$$;

-- Garde-fou : nettoyage automatique des codes expirés (à appeler depuis cron
-- ou lors de la lecture côté webhook)
CREATE OR REPLACE FUNCTION cleanup_expired_pairing_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM channel_pairing_codes
   WHERE (consumed_at IS NOT NULL AND consumed_at < NOW() - INTERVAL '7 days')
      OR (consumed_at IS NULL AND expires_at < NOW() - INTERVAL '1 day');
END;
$$;

COMMENT ON TABLE  channel_pairing_codes IS 'Codes de jumelage 6 chiffres pour lier un wa_id / igsid à un profil utilisateur';
COMMENT ON COLUMN channel_pairing_codes.code IS 'Code 6 chiffres (UNIQUE global pour permettre lookup direct côté webhook)';
COMMENT ON COLUMN channel_pairing_codes.consumed_at IS 'Horodatage de consommation (NULL = code encore valide)';
