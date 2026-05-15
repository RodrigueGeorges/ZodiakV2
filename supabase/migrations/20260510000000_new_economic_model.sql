-- =============================================================================
-- NOUVEAU MODÈLE ÉCONOMIQUE : forfait unique 8,90 €/mois + packs de crédits
-- =============================================================================
-- Remplace la logique plan=free|premium|lifetime par subscription_status +
-- compteurs de messages par cycle. La colonne `plan` est conservée pour
-- compatibilité backward et sera supprimée dans une migration ultérieure.
--
-- Ajouts :
--   profiles         : 4 colonnes (messages_used_this_period, messages_included_per_period,
--                      extra_balance, period_resets_at)
--   extra_purchases  : table des packs extras achetés (valables 12 mois)
--   consume_chat_message(uuid)            : RPC atomique avant chaque call OpenAI
--   refund_chat_message(uuid, text, uuid) : RPC annulation si OpenAI échoue
--   expire_extra_packs()                  : RPC nettoyage quotidien des packs expirés
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Nouvelles colonnes sur profiles
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'messages_used_this_period'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN messages_used_this_period INT NOT NULL DEFAULT 0
      CONSTRAINT chk_msg_used_non_negative CHECK (messages_used_this_period >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'messages_included_per_period'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN messages_included_per_period INT NOT NULL DEFAULT 100
      CONSTRAINT chk_msg_included_positive CHECK (messages_included_per_period > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'extra_balance'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN extra_balance INT NOT NULL DEFAULT 0
      CONSTRAINT chk_extra_balance_non_negative CHECK (extra_balance >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'period_resets_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN period_resets_at TIMESTAMPTZ;
  END IF;
END $$;

COMMENT ON COLUMN profiles.messages_used_this_period
  IS 'Messages chat consommés sur le cycle en cours. Reset par invoice.payment_succeeded Stripe (anniversaire abo).';
COMMENT ON COLUMN profiles.messages_included_per_period
  IS 'Messages inclus dans le forfait par cycle (100 pour le plan Premium).';
COMMENT ON COLUMN profiles.extra_balance
  IS 'Solde agrégé de messages extras achetés (tous packs actifs). Décrémenté par consume_chat_message, incrémenté à l''achat.';
COMMENT ON COLUMN profiles.period_resets_at
  IS 'Prochain reset du compteur messages_used_this_period — date anniversaire de l''abonnement Stripe.';
COMMENT ON COLUMN profiles.plan
  IS '[DEPRECATED v2] Colonne conservée pour compatibilité backward. Remplacée par subscription_status + messages_used_this_period. Supprimer dans une migration ultérieure.';


-- -----------------------------------------------------------------------------
-- 2. Table extra_purchases
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS extra_purchases (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_size                INT     NOT NULL CHECK (pack_size IN (10, 30, 100, 300)),
  pack_name                TEXT    NOT NULL CHECK (pack_name IN ('filante', 'lune', 'constellation', 'galaxie')),
  amount_paid_eur          NUMERIC(10, 2) NOT NULL CHECK (amount_paid_eur > 0),
  stripe_payment_intent_id TEXT    NOT NULL,
  messages_remaining       INT     NOT NULL CHECK (messages_remaining >= 0),
  purchased_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at               TIMESTAMPTZ NOT NULL,  -- 12 mois après achat
  CONSTRAINT extra_purchases_stripe_pi_uniq UNIQUE (stripe_payment_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_extra_purchases_user
  ON extra_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_extra_purchases_expires
  ON extra_purchases(expires_at);

-- Index partiel pour les requêtes fréquentes (packs actifs avec crédits restants)
CREATE INDEX IF NOT EXISTS idx_extra_purchases_user_active
  ON extra_purchases(user_id, purchased_at ASC)
  WHERE messages_remaining > 0;

ALTER TABLE extra_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extra_purchases_owner_select"
  ON extra_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "extra_purchases_service_all"
  ON extra_purchases FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE  extra_purchases IS 'Packs de messages extras achetés via Stripe (valables 12 mois).';
COMMENT ON COLUMN extra_purchases.pack_size                IS 'Taille du pack : 10 | 30 | 100 | 300 messages.';
COMMENT ON COLUMN extra_purchases.pack_name                IS 'filante | lune | constellation | galaxie';
COMMENT ON COLUMN extra_purchases.stripe_payment_intent_id IS 'ID Stripe — UNIQUE pour idempotence webhook.';
COMMENT ON COLUMN extra_purchases.messages_remaining       IS 'Messages encore disponibles. Décrémenté par consume_chat_message.';
COMMENT ON COLUMN extra_purchases.expires_at               IS '12 mois après purchased_at. expire_extra_packs() nettoie et déduit du extra_balance.';


-- -----------------------------------------------------------------------------
-- 3. RPC consume_chat_message — atomique, appelée avant chaque call OpenAI
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION consume_chat_message(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status        TEXT;
  v_used          INT;
  v_included      INT;
  v_extra         INT;
  v_pack_id       UUID;
BEGIN
  -- Verrou sur la ligne profile pour éviter les race conditions (spam)
  SELECT subscription_status,
         messages_used_this_period,
         messages_included_per_period,
         extra_balance
    INTO v_status, v_used, v_included, v_extra
    FROM profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- 1. Subscription inactive → refus
  IF v_status NOT IN ('trial', 'active') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'inactive_subscription');
  END IF;

  -- 2. Quota inclus disponible
  IF v_used < v_included THEN
    UPDATE profiles
       SET messages_used_this_period = messages_used_this_period + 1
     WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success',            true,
      'source',             'included',
      'remaining_included', (v_included - v_used - 1)
    );
  END IF;

  -- 3. Extra balance disponible
  IF v_extra > 0 THEN
    -- Sélectionne le pack le plus ancien non expiré avec des crédits restants
    SELECT id INTO v_pack_id
      FROM extra_purchases
     WHERE user_id = p_user_id
       AND messages_remaining > 0
       AND expires_at > NOW()
     ORDER BY purchased_at ASC
     LIMIT 1
       FOR UPDATE SKIP LOCKED;  -- SKIP LOCKED pour éviter deadlocks sous charge

    IF v_pack_id IS NOT NULL THEN
      UPDATE extra_purchases
         SET messages_remaining = messages_remaining - 1
       WHERE id = v_pack_id;
    END IF;

    UPDATE profiles
       SET extra_balance = extra_balance - 1
     WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success',          true,
      'source',           'extra',
      'remaining_extras', (v_extra - 1),
      'pack_id',          v_pack_id
    );
  END IF;

  -- 4. Quota épuisé
  RETURN jsonb_build_object('success', false, 'reason', 'quota_exceeded');
END;
$$;

GRANT EXECUTE ON FUNCTION consume_chat_message(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION consume_chat_message(UUID) IS
  'Tente de consommer un message chat. Ordre de priorité : quota inclus → extra balance. '
  'Retourne {success, source, remaining_*} ou {success: false, reason}. '
  'Appeler refund_chat_message() si l''appel OpenAI échoue après cette RPC.';


-- -----------------------------------------------------------------------------
-- 4. RPC refund_chat_message — annule un consume si OpenAI échoue
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refund_chat_message(
  p_user_id UUID,
  p_source  TEXT,              -- 'included' | 'extra'
  p_pack_id UUID DEFAULT NULL  -- pack_id retourné par consume_chat_message
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_source = 'included' THEN
    UPDATE profiles
       SET messages_used_this_period = GREATEST(0, messages_used_this_period - 1)
     WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'refunded', 'included');

  ELSIF p_source = 'extra' THEN
    UPDATE profiles
       SET extra_balance = extra_balance + 1
     WHERE id = p_user_id;

    -- Ré-incrémente le pack si l'id est connu (best-effort)
    IF p_pack_id IS NOT NULL THEN
      UPDATE extra_purchases
         SET messages_remaining = messages_remaining + 1
       WHERE id = p_pack_id
         AND user_id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'refunded', 'extra');

  ELSE
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_source');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION refund_chat_message(UUID, TEXT, UUID) TO authenticated, service_role;

COMMENT ON FUNCTION refund_chat_message(UUID, TEXT, UUID) IS
  'Annule un consume_chat_message quand l''appel OpenAI échoue. '
  'p_source doit correspondre exactement au ''source'' retourné par consume_chat_message.';


-- -----------------------------------------------------------------------------
-- 5. RPC expire_extra_packs — nettoyage des packs expirés (cron quotidien)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION expire_extra_packs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack   RECORD;
  v_count  INT := 0;
BEGIN
  FOR v_pack IN
    SELECT id, user_id, messages_remaining
      FROM extra_purchases
     WHERE expires_at <= NOW()
       AND messages_remaining > 0
       FOR UPDATE
  LOOP
    -- Déduit les crédits expirés du solde utilisateur
    UPDATE profiles
       SET extra_balance = GREATEST(0, extra_balance - v_pack.messages_remaining)
     WHERE id = v_pack.user_id;

    -- Épuise le pack
    UPDATE extra_purchases
       SET messages_remaining = 0
     WHERE id = v_pack.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('expired_packs_cleaned', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION expire_extra_packs() TO service_role;

COMMENT ON FUNCTION expire_extra_packs() IS
  'Nettoie les packs extra expirés et déduit leurs crédits restants du extra_balance. '
  'À appeler quotidiennement via un cron Netlify.';


-- -----------------------------------------------------------------------------
-- 6. RPC add_extra_balance — appelée par le webhook Stripe après achat de pack
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION add_extra_balance(p_user_id UUID, p_amount INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
     SET extra_balance = extra_balance + p_amount
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  RETURN jsonb_build_object('success', true, 'added', p_amount);
END;
$$;

GRANT EXECUTE ON FUNCTION add_extra_balance(UUID, INT) TO service_role;

COMMENT ON FUNCTION add_extra_balance(UUID, INT) IS
  'Incrémente atomiquement extra_balance après achat d''un pack via Stripe. '
  'Appelée par le webhook stripe-webhook.ts sur checkout.session.completed (mode=payment).';
