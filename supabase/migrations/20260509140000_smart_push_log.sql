-- =========================================================================
-- Migration : table de log des smart push notifications.
--
-- Sert à dédupliquer les envois côté serveur (un user ne reçoit jamais
-- 2 fois le même push pour le même moment astrologique).
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

COMMENT ON TABLE smart_push_log IS 'Log des smart push contextuels envoyés (dédup serveur).';
COMMENT ON COLUMN smart_push_log.slug IS 'Identifiant unique du moment (ex: full_moon_2026-05-12).';
