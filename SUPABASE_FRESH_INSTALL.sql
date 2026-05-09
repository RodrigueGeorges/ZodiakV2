-- =============================================================================
-- ZODIAK V2 — INSTALLATION COMPLÈTE SUPABASE (NOUVELLE BASE)
-- =============================================================================
-- À coller dans une nouvelle base Supabase, dans le SQL Editor, en UNE FOIS.
-- Génère le schéma complet utilisé par l'application actuelle (WhatsApp +
-- Instagram, streaks, mood, push, badges, friends, synastries, chat memory,
-- premium tier).
--
-- Pré-requis : Supabase Auth doit déjà exister (ce qui est le cas par défaut
-- sur tout projet Supabase — la table `auth.users` est gérée par la plateforme).
--
-- Ordre :
--   1) Extensions
--   2) Helpers (set_updated_at)
--   3) profiles (table racine, FK partout)
--   4) Tables guidance / messaging / cache
--   5) Tables engagement (streaks, mood, push, badges)
--   6) Tables relations (friends, synastries)
--   7) Tables chat (messages, memory)
--   8) Premium / quotas
--   9) Fonctions RPC
--  10) Triggers
-- =============================================================================


-- =========================================================================
-- 1. EXTENSIONS
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================================
-- 2. HELPER : trigger générique updated_at
-- =========================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================================
-- 3. PROFILES (table racine)
-- =========================================================================
CREATE TABLE profiles (
  id                       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                     text NOT NULL,
  phone                    text,
  birth_date               date NOT NULL,
  birth_time               time NOT NULL,
  birth_place              text NOT NULL,
  natal_chart              jsonb,
  natal_chart_interpretation text,
  natal_summary            text,

  trial_ends_at            timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  subscription_status      text NOT NULL DEFAULT 'trial'
                             CHECK (subscription_status IN ('trial','active','expired')),
  last_guidance_sent       timestamptz,

  -- Multi-canal Meta
  daily_guidance_enabled   boolean NOT NULL DEFAULT false,
  preferred_channel        text CHECK (preferred_channel IN ('whatsapp','instagram') OR preferred_channel IS NULL),
  whatsapp_wa_id           text UNIQUE,
  whatsapp_e164            text,
  instagram_igsid          text UNIQUE,
  instagram_username       text,
  channel_opt_in_at        timestamptz,
  timezone                 text NOT NULL DEFAULT 'Europe/Paris',
  guidance_hour            smallint NOT NULL DEFAULT 8 CHECK (guidance_hour BETWEEN 0 AND 23),

  -- Premium tier
  plan                     text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium','lifetime')),
  plan_renews_at           timestamptz,
  stripe_customer_id       text,

  avatar_url               text,

  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX profiles_guidance_dispatch_idx
  ON profiles (guidance_hour, preferred_channel, daily_guidance_enabled)
  WHERE daily_guidance_enabled = true;
CREATE INDEX profiles_whatsapp_wa_id_idx ON profiles (whatsapp_wa_id);
CREATE INDEX profiles_instagram_igsid_idx ON profiles (instagram_igsid);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_select" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_owner_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_service_all" ON profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =========================================================================
-- 4. GUIDANCE & MESSAGING
-- =========================================================================

-- 4.1 daily_guidance : guidance générée pour un user / date
CREATE TABLE daily_guidance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  summary     text NOT NULL,
  love        text NOT NULL,
  work        text NOT NULL,
  energy      text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);
CREATE INDEX daily_guidance_user_id_idx ON daily_guidance(user_id);
CREATE INDEX daily_guidance_date_idx    ON daily_guidance(date);

ALTER TABLE daily_guidance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_guidance_owner_select" ON daily_guidance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "daily_guidance_service_all" ON daily_guidance
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.2 guidance_token : lien court (short_code) vers la guidance du jour
CREATE TABLE guidance_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,
  short_code  varchar(16) UNIQUE,
  date        date NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT  guidance_token_user_date_unique UNIQUE (user_id, date)
);
CREATE INDEX idx_guidance_token_token      ON guidance_token(token);
CREATE INDEX idx_guidance_token_short_code ON guidance_token(short_code);

ALTER TABLE guidance_token ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guidance_token_owner_select" ON guidance_token
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "guidance_token_service_all" ON guidance_token
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.3 guidance_cache : cache OpenAI pour éviter regénérations
CREATE TABLE guidance_cache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key     text NOT NULL UNIQUE,
  guidance_data jsonb NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX idx_guidance_cache_key        ON guidance_cache(cache_key);
CREATE INDEX idx_guidance_cache_data       ON guidance_cache USING GIN (guidance_data);
CREATE INDEX idx_guidance_cache_created_at ON guidance_cache(created_at);

ALTER TABLE guidance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guidance_cache_service_all" ON guidance_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.4 daily_transits : cache des transits planétaires du jour
CREATE TABLE daily_transits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date         date NOT NULL UNIQUE,
  transit_data jsonb NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX idx_daily_transits_date ON daily_transits(date);
CREATE INDEX idx_daily_transits_data ON daily_transits USING GIN (transit_data);

ALTER TABLE daily_transits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_transits_service_all" ON daily_transits
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.5 conversations : agent conversationnel ChatAstro (snapshot)
CREATE TABLE conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  messages    jsonb NOT NULL DEFAULT '[]',
  preferences jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_owner_all" ON conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conversations_service_all" ON conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.6 inbound_messages : messages reçus via webhook Meta
CREATE TABLE inbound_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "from"       text NOT NULL,
  text         text NOT NULL,
  timestamp    timestamptz NOT NULL DEFAULT now(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'received'
                 CHECK (status IN ('received','processed','error')),
  metadata     jsonb,
  error        text,
  processed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX inbound_messages_user_id_idx   ON inbound_messages(user_id);
CREATE INDEX inbound_messages_timestamp_idx ON inbound_messages(timestamp DESC);
CREATE INDEX inbound_messages_status_idx    ON inbound_messages(status);

ALTER TABLE inbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbound_messages_owner_select" ON inbound_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inbound_messages_service_all" ON inbound_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.7 message_delivery_receipts : statuts de livraison
CREATE TABLE message_delivery_receipts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  status     text NOT NULL,
  error_code text,
  timestamp  timestamptz NOT NULL DEFAULT now(),
  metadata   jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX message_delivery_receipts_message_id_idx ON message_delivery_receipts(message_id);
CREATE INDEX message_delivery_receipts_status_idx     ON message_delivery_receipts(status);
CREATE INDEX message_delivery_receipts_timestamp_idx  ON message_delivery_receipts(timestamp DESC);

ALTER TABLE message_delivery_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_receipts_service_all" ON message_delivery_receipts
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.8 message_log : journal universel multi-canal (WhatsApp + Instagram)
CREATE TABLE message_log (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel                  text NOT NULL CHECK (channel IN ('whatsapp','instagram')),
  direction                text NOT NULL CHECK (direction IN ('outbound','inbound')),
  message_type             text NOT NULL CHECK (message_type IN ('template','text','reaction','opt_in','system')),
  template_name            text,
  short_code               varchar(16),
  guidance_token_id        uuid REFERENCES guidance_token(id) ON DELETE SET NULL,
  provider_message_id      text,
  provider_conversation_id text,
  payload                  jsonb,
  sent_at                  timestamptz DEFAULT now(),
  delivered_at             timestamptz,
  read_at                  timestamptz,
  clicked_at               timestamptz,
  failed_at                timestamptz,
  error_code               text,
  error_message            text,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  CONSTRAINT message_log_provider_message_id_uniq UNIQUE (provider_message_id)
);
CREATE INDEX message_log_user_id_idx    ON message_log (user_id);
CREATE INDEX message_log_channel_idx    ON message_log (channel);
CREATE INDEX message_log_short_code_idx ON message_log (short_code);
CREATE INDEX message_log_sent_at_idx    ON message_log (sent_at DESC);
CREATE INDEX message_log_user_day_idx   ON message_log (user_id, channel, ((sent_at AT TIME ZONE 'UTC')::date));

ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_log_owner_select" ON message_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "message_log_service_all" ON message_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4.9 channel_pairing_codes : codes 6 chiffres pour lier wa_id/igsid au profil
CREATE TABLE channel_pairing_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code        varchar(6) NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT  channel_pairing_codes_code_unique UNIQUE (code)
);
CREATE INDEX channel_pairing_codes_user_id_idx ON channel_pairing_codes (user_id);
CREATE INDEX channel_pairing_codes_active_idx
  ON channel_pairing_codes (code) WHERE consumed_at IS NULL;

ALTER TABLE channel_pairing_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_pairing_codes_owner_all" ON channel_pairing_codes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "channel_pairing_codes_service_all" ON channel_pairing_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =========================================================================
-- 5. ENGAGEMENT : streaks, mood, push, badges
-- =========================================================================

-- 5.1 streaks
CREATE TABLE streaks (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_count  integer NOT NULL DEFAULT 0,
  best_count     integer NOT NULL DEFAULT 0,
  last_check_in  date,
  total_days     integer NOT NULL DEFAULT 0,
  freeze_used_at date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_owner_read"   ON streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "streaks_owner_upsert" ON streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_owner_update" ON streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_service_all"  ON streaks FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 5.2 mood_logs
CREATE TABLE mood_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  mood        text NOT NULL CHECK (mood IN ('radiant','calm','pensive','tense','tired','inspired')),
  intensity   integer NOT NULL DEFAULT 50 CHECK (intensity BETWEEN 0 AND 100),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
CREATE INDEX idx_mood_logs_user_date ON mood_logs (user_id, date DESC);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mood_logs_owner_read"   ON mood_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mood_logs_owner_insert" ON mood_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mood_logs_owner_update" ON mood_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mood_logs_service_all"  ON mood_logs FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 5.3 push_subscriptions
CREATE TABLE push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     text NOT NULL,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE (user_id, endpoint)
);
CREATE INDEX idx_push_user ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_owner_read"   ON push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "push_owner_insert" ON push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_owner_delete" ON push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "push_service_all"  ON push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 5.4 user_badges
CREATE TABLE user_badges (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id  text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata  jsonb,
  UNIQUE (user_id, badge_id)
);
CREATE INDEX idx_user_badges_user ON user_badges (user_id, earned_at DESC);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_owner_read"   ON user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "badges_owner_insert" ON user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "badges_service_all"  ON user_badges FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =========================================================================
-- 6. RELATIONS : friends + synastries
-- =========================================================================

-- 6.1 friends
CREATE TABLE friends (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  relationship  text CHECK (relationship IN ('partner','crush','family','friend','colleague','other')),
  birth_date    date NOT NULL,
  birth_time    time,
  birth_place   text,
  natal_chart   jsonb,
  natal_summary text,
  avatar_emoji  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_friends_user ON friends (user_id, created_at DESC);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friends_owner_all"   ON friends FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friends_service_all" ON friends FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 6.2 synastries
CREATE TABLE synastries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id        uuid NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  base_score       integer NOT NULL CHECK (base_score BETWEEN 0 AND 100),
  daily_score      integer CHECK (daily_score BETWEEN 0 AND 100),
  daily_score_date date,
  aspects          jsonb,
  summary          text,
  highlights       jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);
CREATE INDEX idx_synastries_user ON synastries (user_id, base_score DESC);

ALTER TABLE synastries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "synastries_owner_read"   ON synastries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "synastries_owner_insert" ON synastries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "synastries_owner_update" ON synastries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "synastries_owner_delete" ON synastries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "synastries_service_all"  ON synastries FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =========================================================================
-- 7. CHAT : messages + memory long-terme
-- =========================================================================

-- 7.1 chat_messages
CREATE TABLE chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user','assistant','system')),
  content    text NOT NULL,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_user_date ON chat_messages (user_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_owner_read"   ON chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_owner_insert" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_owner_delete" ON chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_service_all"  ON chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 7.2 chat_memory
CREATE TABLE chat_memory (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary    text,
  facts      jsonb,
  topics     jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_memory_owner_read"   ON chat_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_memory_owner_upsert" ON chat_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_memory_owner_update" ON chat_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_memory_service_all"  ON chat_memory FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =========================================================================
-- 8. PREMIUM / QUOTAS
-- =========================================================================

-- 8.1 usage_quotas
CREATE TABLE usage_quotas (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date    date NOT NULL,
  feature text NOT NULL,
  count   integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, date, feature)
);
CREATE INDEX idx_usage_quotas_user_date ON usage_quotas (user_id, date);

ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_quotas_owner_read" ON usage_quotas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "usage_quotas_service_all" ON usage_quotas FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =========================================================================
-- 9. FONCTIONS RPC & UTILITAIRES
-- =========================================================================

-- 9.1 increment_usage : rate-limit atomique côté DB
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_feature text,
  p_max     integer
) RETURNS TABLE (allowed boolean, current_count integer) AS $$
DECLARE
  today date := (now() AT TIME ZONE 'UTC')::date;
  cur_count integer;
BEGIN
  INSERT INTO usage_quotas (user_id, date, feature, count)
  VALUES (p_user_id, today, p_feature, 1)
  ON CONFLICT (user_id, date, feature)
    DO UPDATE SET count = usage_quotas.count + 1
  RETURNING count INTO cur_count;

  IF cur_count > p_max THEN
    UPDATE usage_quotas
       SET count = count - 1
     WHERE user_id = p_user_id AND date = today AND feature = p_feature;
    RETURN QUERY SELECT false, p_max;
  ELSE
    RETURN QUERY SELECT true, cur_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_usage TO authenticated, service_role;


-- 9.2 generate_pairing_code : code 6 chiffres pour le jumelage WhatsApp/Insta
CREATE OR REPLACE FUNCTION generate_pairing_code(p_user_id uuid)
RETURNS varchar(6)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code varchar(6);
  v_attempt int := 0;
BEGIN
  UPDATE channel_pairing_codes
     SET consumed_at = now()
   WHERE user_id = p_user_id AND consumed_at IS NULL;

  LOOP
    v_attempt := v_attempt + 1;
    v_code := lpad((floor(random() * 1000000))::text, 6, '0');

    BEGIN
      INSERT INTO channel_pairing_codes (user_id, code, expires_at)
      VALUES (p_user_id, v_code, now() + interval '15 minutes');
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt > 10 THEN
        RAISE EXCEPTION 'Impossible de générer un code unique après 10 tentatives';
      END IF;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_pairing_code TO authenticated, service_role;


-- 9.3 cleanup_expired_pairing_codes : nettoyage
CREATE OR REPLACE FUNCTION cleanup_expired_pairing_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM channel_pairing_codes
   WHERE (consumed_at IS NOT NULL AND consumed_at < now() - interval '7 days')
      OR (consumed_at IS NULL AND expires_at < now() - interval '1 day');
END;
$$;


-- 9.4 cleanup_old_guidance_cache : purge cache > 30 jours
CREATE OR REPLACE FUNCTION cleanup_old_guidance_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM guidance_cache WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;


-- 9.5 mark_message_processed / mark_message_error
CREATE OR REPLACE FUNCTION mark_message_processed(
  message_id uuid,
  metadata_json jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE inbound_messages
     SET status = 'processed', metadata = metadata_json, processed_at = now()
   WHERE id = message_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_message_error(
  message_id uuid,
  error_message text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE inbound_messages
     SET status = 'error', error = error_message, processed_at = now()
   WHERE id = message_id;
END;
$$;


-- 9.6 update_message_log_updated_at (trigger function)
CREATE OR REPLACE FUNCTION update_message_log_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================================
-- 10. TRIGGERS updated_at
-- =========================================================================
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER guidance_cache_set_updated_at
  BEFORE UPDATE ON guidance_cache
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER daily_transits_set_updated_at
  BEFORE UPDATE ON daily_transits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER message_log_updated_at_trg
  BEFORE UPDATE ON message_log
  FOR EACH ROW EXECUTE FUNCTION update_message_log_updated_at();

CREATE TRIGGER streaks_set_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER friends_set_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER synastries_set_updated_at
  BEFORE UPDATE ON synastries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER chat_memory_set_updated_at
  BEFORE UPDATE ON chat_memory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =========================================================================
-- ✅ TERMINÉ
-- =========================================================================
-- Vérification rapide :
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' ORDER BY table_name;
--
-- Tu devrais voir 18 tables :
--   chat_memory, chat_messages, channel_pairing_codes, conversations,
--   daily_guidance, daily_transits, friends, guidance_cache, guidance_token,
--   inbound_messages, message_delivery_receipts, message_log, mood_logs,
--   profiles, push_subscriptions, streaks, synastries, usage_quotas, user_badges
-- =========================================================================
