-- =============================================================================
-- P0 SECURITY + MIGRATION META (WhatsApp + Instagram)
-- =============================================================================
-- Cette migration fait DEUX choses critiques :
--   1. P0 SECURITY  : ferme les RLS publiques dangereuses sur guidance_token,
--                     sms_tracking, guidance_cache (lecture publique = fuite
--                     totale des short_codes, tokens, user_id, etc.)
--   2. NEW SCHEMA   : pose le socle multi-canal pour la migration vers
--                     WhatsApp Cloud API + Instagram Messaging API.
--
-- Compatibilité ascendante : aucune colonne/table n'est supprimée ici, tout est
-- additif ou ajouté en parallèle. Une seconde migration "phase2" pourra droper
-- les colonnes SMS legacy une fois la migration Meta validée en prod.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. P0 SÉCURITÉ : refermer les RLS publiques
-- -----------------------------------------------------------------------------
-- Les fonctions Netlify utilisent SUPABASE_SERVICE_ROLE_KEY qui bypass RLS.
-- Aucune raison légitime d'avoir une lecture "to public USING (true)" sur ces
-- tables sensibles : un attaquant avec la clé anon (présente dans le bundle
-- JS public) pouvait jusqu'ici lire tous les short_codes/tokens/user_id.

-- guidance_token : lecture publique → service_role uniquement
DROP POLICY IF EXISTS "Allow read by short_code or token" ON guidance_token;
DROP POLICY IF EXISTS "Allow public read access to guidance_token" ON guidance_token;

-- sms_tracking : lecture publique → on garde uniquement la policy "owner"
DROP POLICY IF EXISTS "Allow read for sms_tracking" ON sms_tracking;
-- (la policy "Users can view their own SMS tracking" reste intacte)

-- guidance_cache : la lecture publique servait au front, mais en pratique tout
-- passe par les fonctions serveur. On bascule en service_role uniquement.
DROP POLICY IF EXISTS "Allow public read access to guidance_cache" ON guidance_cache;

CREATE POLICY "guidance_cache_service_role_read"
  ON guidance_cache
  FOR SELECT
  TO service_role
  USING (true);

-- (les policies INSERT/UPDATE existantes sur guidance_cache pour service_role
-- restent en place via le check (true) — service_role bypass RLS de toute
-- façon, donc elles sont surtout là pour documenter l'intention)


-- -----------------------------------------------------------------------------
-- 2. NOUVELLES COLONNES profiles : multi-canal + fuseau horaire
-- -----------------------------------------------------------------------------
-- On AJOUTE les nouvelles colonnes sans renommer les anciennes (compat),
-- avec un trigger qui synchronise daily_guidance_enabled <-> daily_guidance_sms_enabled
-- pendant la phase de transition.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_channel'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN preferred_channel TEXT
      CHECK (preferred_channel IS NULL OR preferred_channel IN ('whatsapp', 'instagram'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp_wa_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp_wa_id TEXT UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp_e164'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp_e164 TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'instagram_igsid'
  ) THEN
    ALTER TABLE profiles ADD COLUMN instagram_igsid TEXT UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'instagram_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN instagram_username TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'channel_opt_in_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN channel_opt_in_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Europe/Paris';
  END IF;
END $$;

-- daily_guidance_enabled : nouveau nom canal-agnostique. On l'aligne sur
-- l'ancien daily_guidance_sms_enabled pendant la transition.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_guidance_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_guidance_enabled BOOLEAN DEFAULT false;

    -- Backfill depuis la colonne SMS legacy
    UPDATE profiles
       SET daily_guidance_enabled = COALESCE(daily_guidance_sms_enabled, false)
     WHERE daily_guidance_enabled IS NULL OR daily_guidance_enabled = false;
  END IF;
END $$;

-- guidance_hour : 0..23, dérivé de guidance_time (TIME) pour faciliter le
-- matching dans le cron horaire.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'guidance_hour'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN guidance_hour SMALLINT DEFAULT 8
      CHECK (guidance_hour BETWEEN 0 AND 23);

    -- Backfill depuis guidance_time si présent
    UPDATE profiles
       SET guidance_hour = EXTRACT(HOUR FROM guidance_time)::SMALLINT
     WHERE guidance_time IS NOT NULL;
  END IF;
END $$;

-- Index pour le cron horaire (sélection efficace par heure × canal × état)
CREATE INDEX IF NOT EXISTS profiles_guidance_dispatch_idx
  ON profiles (guidance_hour, preferred_channel, daily_guidance_enabled)
  WHERE daily_guidance_enabled = true;

CREATE INDEX IF NOT EXISTS profiles_whatsapp_wa_id_idx ON profiles (whatsapp_wa_id);
CREATE INDEX IF NOT EXISTS profiles_instagram_igsid_idx ON profiles (instagram_igsid);

COMMENT ON COLUMN profiles.preferred_channel       IS 'Canal de réception préféré : whatsapp | instagram';
COMMENT ON COLUMN profiles.whatsapp_wa_id          IS 'ID WhatsApp Cloud API (wa_id du webhook contacts)';
COMMENT ON COLUMN profiles.whatsapp_e164           IS 'Numéro E.164 affiché côté UI (sans le "+", format Meta)';
COMMENT ON COLUMN profiles.instagram_igsid         IS 'Instagram-scoped user ID (igsid) reçu via webhook DM';
COMMENT ON COLUMN profiles.instagram_username      IS 'Handle IG affiché à l''utilisateur (informatif, pas un identifiant stable)';
COMMENT ON COLUMN profiles.channel_opt_in_at       IS 'Horodatage de l''opt-in user (preuve de consentement Meta)';
COMMENT ON COLUMN profiles.timezone                IS 'Fuseau horaire IANA (ex: Europe/Paris) pour le cron horaire';
COMMENT ON COLUMN profiles.daily_guidance_enabled  IS 'Toggle universel guidance quotidienne (canal-agnostique). Remplace daily_guidance_sms_enabled.';
COMMENT ON COLUMN profiles.guidance_hour           IS 'Heure préférée (0-23) dans le fuseau de l''utilisateur';


-- -----------------------------------------------------------------------------
-- 3. TABLE message_log : remplaçant canal-agnostique de sms_tracking
-- -----------------------------------------------------------------------------
-- Conçue pour WhatsApp ET Instagram dès le départ. Idempotence via
-- UNIQUE(provider_message_id) pour absorber les retries Meta.

CREATE TABLE IF NOT EXISTS message_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel              TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram')),
  direction            TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  message_type         TEXT NOT NULL CHECK (message_type IN ('template', 'text', 'reaction', 'opt_in', 'system')),
  template_name        TEXT,
  short_code           VARCHAR(16),
  guidance_token_id    UUID REFERENCES guidance_token(id) ON DELETE SET NULL,
  provider_message_id  TEXT,
  provider_conversation_id TEXT,
  payload              JSONB,
  sent_at              TIMESTAMPTZ DEFAULT NOW(),
  delivered_at         TIMESTAMPTZ,
  read_at              TIMESTAMPTZ,
  clicked_at           TIMESTAMPTZ,
  failed_at            TIMESTAMPTZ,
  error_code           TEXT,
  error_message        TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT message_log_provider_message_id_uniq UNIQUE (provider_message_id)
);

CREATE INDEX IF NOT EXISTS message_log_user_id_idx       ON message_log (user_id);
CREATE INDEX IF NOT EXISTS message_log_channel_idx       ON message_log (channel);
CREATE INDEX IF NOT EXISTS message_log_short_code_idx    ON message_log (short_code);
CREATE INDEX IF NOT EXISTS message_log_sent_at_idx       ON message_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS message_log_user_day_idx      ON message_log (user_id, channel, (sent_at::date));

ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_log_owner_select"
  ON message_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role policies (documentation; service_role bypass RLS)
CREATE POLICY "message_log_service_insert"
  ON message_log FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "message_log_service_update"
  ON message_log FOR UPDATE TO service_role USING (true);

CREATE OR REPLACE FUNCTION update_message_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_log_updated_at_trg ON message_log;
CREATE TRIGGER message_log_updated_at_trg
  BEFORE UPDATE ON message_log
  FOR EACH ROW EXECUTE FUNCTION update_message_log_updated_at();

COMMENT ON TABLE  message_log IS 'Journal universel des messages WhatsApp/Instagram (in/out, statuts, tracking).';
COMMENT ON COLUMN message_log.provider_message_id IS 'wamid.xxx (WhatsApp) ou mid.xxx (Instagram) — UNIQUE pour idempotence webhook';
COMMENT ON COLUMN message_log.template_name       IS 'Nom du template HSM utilisé (WhatsApp Marketing/Utility)';


-- -----------------------------------------------------------------------------
-- 4. SYNC TRIGGER (compat) : daily_guidance_sms_enabled <-> daily_guidance_enabled
-- -----------------------------------------------------------------------------
-- Pendant la transition, on garde l'ancienne colonne en miroir de la nouvelle
-- pour éviter de casser le code legacy non encore migré. Cette sync est
-- supprimée en phase 2 quand le code SMS sera retiré.

CREATE OR REPLACE FUNCTION sync_daily_guidance_enabled()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on touche la nouvelle colonne, propager vers l'ancienne
  IF NEW.daily_guidance_enabled IS DISTINCT FROM OLD.daily_guidance_enabled THEN
    NEW.daily_guidance_sms_enabled := NEW.daily_guidance_enabled;
  END IF;
  -- Si on touche l'ancienne colonne (code legacy), propager vers la nouvelle
  IF NEW.daily_guidance_sms_enabled IS DISTINCT FROM OLD.daily_guidance_sms_enabled
     AND NEW.daily_guidance_enabled = OLD.daily_guidance_enabled THEN
    NEW.daily_guidance_enabled := NEW.daily_guidance_sms_enabled;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_sync_guidance_enabled_trg ON profiles;
CREATE TRIGGER profiles_sync_guidance_enabled_trg
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_daily_guidance_enabled();


-- -----------------------------------------------------------------------------
-- 5. CORRECTION sms_tracking : colonnes manquantes utilisées par get-token.ts
-- -----------------------------------------------------------------------------
-- get-token.ts insérait sur les colonnes `action` et `accessed_at` qui
-- n'existaient pas → metric "access" silencieusement perdue.
-- On les ajoute pour fermer le bug avant de retirer entièrement sms_tracking
-- en phase 2.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sms_tracking' AND column_name = 'action'
  ) THEN
    ALTER TABLE sms_tracking ADD COLUMN action TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sms_tracking' AND column_name = 'accessed_at'
  ) THEN
    ALTER TABLE sms_tracking ADD COLUMN accessed_at TIMESTAMPTZ;
  END IF;
END $$;
