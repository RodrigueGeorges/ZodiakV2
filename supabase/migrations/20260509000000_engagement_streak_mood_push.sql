-- =============================================================================
-- SPRINT 6 : Boucle d'engagement quotidienne
-- =============================================================================
-- Tables ajoutées :
--   - streaks            : flamme de jours consécutifs
--   - mood_logs          : check-in émotionnel quotidien (alimente l'IA)
--   - push_subscriptions : abonnements Web Push (re-engagement)
--   - badges             : badges silencieux (gamification douce)
--
-- RLS : owner (auth.uid() = user_id) en lecture, écriture via service_role
--       pour les fonctions Netlify, sauf mood_logs où l'écriture owner est OK.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. streaks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS streaks (
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

CREATE POLICY "streaks_owner_read"
  ON streaks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "streaks_owner_upsert"
  ON streaks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_owner_update"
  ON streaks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_service_all"
  ON streaks FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 2. mood_logs
-- ---------------------------------------------------------------------------
-- Un mood par user et par jour. Alimente le prompt OpenAI pour adapter le ton
-- de la guidance.
CREATE TABLE IF NOT EXISTS mood_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  mood        text NOT NULL CHECK (mood IN ('radiant', 'calm', 'pensive', 'tense', 'tired', 'inspired')),
  intensity   integer NOT NULL DEFAULT 50 CHECK (intensity BETWEEN 0 AND 100),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date
  ON mood_logs (user_id, date DESC);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mood_logs_owner_read"
  ON mood_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "mood_logs_owner_insert"
  ON mood_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_logs_owner_update"
  ON mood_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_logs_service_all"
  ON mood_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 3. push_subscriptions
-- ---------------------------------------------------------------------------
-- Stockage des PushSubscription Web. On garde une ligne par device.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_user
  ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_owner_read"
  ON push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "push_owner_insert"
  ON push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_owner_delete"
  ON push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "push_service_all"
  ON push_subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 4. badges
-- ---------------------------------------------------------------------------
-- Badges silencieux gagnés par l'utilisateur. Pas de classement public.
CREATE TABLE IF NOT EXISTS user_badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    text NOT NULL,
  earned_at   timestamptz NOT NULL DEFAULT now(),
  metadata    jsonb,
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
  ON user_badges (user_id, earned_at DESC);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_owner_read"
  ON user_badges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "badges_owner_insert"
  ON user_badges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "badges_service_all"
  ON user_badges FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 5. trigger updated_at sur streaks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS streaks_set_updated_at ON streaks;
CREATE TRIGGER streaks_set_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
