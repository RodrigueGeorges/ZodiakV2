-- =============================================================================
-- SPRINT 7 : Synastrie / amis & SPRINT 9 : Mémoire long-terme ChatAstro
-- =============================================================================
-- Tables :
--   - friends            : carnet d'amis (proches, partenaires, collègues…)
--                          Chaque "ami" a une carte natale calculée et stockée.
--   - synastries         : score & aspects entre deux cartes (user ↔ friend)
--   - chat_messages      : historique long-terme des conversations
--   - chat_memory        : résumé condensé + faits structurés sur l'user
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. friends
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friends (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  relationship    text CHECK (relationship IN ('partner','crush','family','friend','colleague','other')),
  birth_date      date NOT NULL,
  birth_time      time,
  birth_place     text,
  natal_chart     jsonb,
  natal_summary   text,
  avatar_emoji    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friends_user
  ON friends (user_id, created_at DESC);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friends_owner_all"
  ON friends FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friends_service_all"
  ON friends FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 2. synastries
-- ---------------------------------------------------------------------------
-- Score & aspects entre la carte de l'user et celle d'un friend.
-- On garde aussi une "daily_score" calculée chaque jour selon les transits.
CREATE TABLE IF NOT EXISTS synastries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id       uuid NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  base_score      integer NOT NULL CHECK (base_score BETWEEN 0 AND 100),
  daily_score     integer CHECK (daily_score BETWEEN 0 AND 100),
  daily_score_date date,
  aspects         jsonb,
  summary         text,
  highlights      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_synastries_user
  ON synastries (user_id, base_score DESC);

ALTER TABLE synastries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "synastries_owner_read"
  ON synastries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "synastries_owner_insert"
  ON synastries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "synastries_owner_update"
  ON synastries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "synastries_owner_delete"
  ON synastries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "synastries_service_all"
  ON synastries FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 3. chat_messages
-- ---------------------------------------------------------------------------
-- Historique complet des messages avec le ChatAstro. On en garde tous les
-- messages pour la mémoire long-terme.
CREATE TABLE IF NOT EXISTS chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user','assistant','system')),
  content     text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date
  ON chat_messages (user_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_owner_read"
  ON chat_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_owner_insert"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_messages_owner_delete"
  ON chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_service_all"
  ON chat_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 4. chat_memory
-- ---------------------------------------------------------------------------
-- Résumé condensé long-terme de ce que l'IA "sait" de l'user, mis à jour
-- périodiquement (cf. fonction Netlify update-chat-memory).
CREATE TABLE IF NOT EXISTS chat_memory (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary     text,
  facts       jsonb,
  topics      jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_memory_owner_read"
  ON chat_memory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "chat_memory_owner_upsert"
  ON chat_memory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_memory_owner_update"
  ON chat_memory FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_memory_service_all"
  ON chat_memory FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 5. updated_at triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS friends_set_updated_at ON friends;
CREATE TRIGGER friends_set_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS synastries_set_updated_at ON synastries;
CREATE TRIGGER synastries_set_updated_at
  BEFORE UPDATE ON synastries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS chat_memory_set_updated_at ON chat_memory;
CREATE TRIGGER chat_memory_set_updated_at
  BEFORE UPDATE ON chat_memory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
