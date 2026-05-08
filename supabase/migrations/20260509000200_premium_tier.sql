-- =============================================================================
-- SPRINT 8 : Tiers premium
-- =============================================================================
-- Ajoute la notion de plan (free / premium) sur profiles et un compteur
-- d'usage pour les features rate-limitées sur le free tier.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','premium','lifetime'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_renews_at timestamptz;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Compteurs d'usage par jour (synastries calculées, messages chat, etc.)
CREATE TABLE IF NOT EXISTS usage_quotas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  feature     text NOT NULL,
  count       integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, date, feature)
);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_date
  ON usage_quotas (user_id, date);

ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_quotas_owner_read"
  ON usage_quotas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "usage_quotas_service_all"
  ON usage_quotas FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- RPC pour incrémenter atomiquement un compteur (rate-limit côté DB).
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
    -- Rollback à -1 pour ne pas comptabiliser un usage refusé
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
