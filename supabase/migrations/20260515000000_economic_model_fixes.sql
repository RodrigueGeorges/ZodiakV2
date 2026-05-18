-- =============================================================================
-- FIXES MODÈLE ÉCONOMIQUE — Audit du 15/05/2026
-- =============================================================================
-- Corrige les bugs identifiés dans 20260510000000_new_economic_model.sql :
--   #2  Gift migration → colonnes migration_gift_* sur profiles (traçabilité
--       sans pollution de extra_purchases)
--   #3  past_due → support du statut Stripe pendant les retries
--   #4  cancel_at_period_end → colonne subscription_ends_at pour l'accès
--       résiduel après annulation
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. subscription_ends_at : date de fin d'accès si l'abo a été annulé
--    (Stripe cancel_at_period_end). Permet de garder l'accès jusqu'à la fin
--    de la période payée même si subscription_status = 'cancelled'.
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_ends_at TIMESTAMPTZ;
  END IF;
END $$;

COMMENT ON COLUMN profiles.subscription_ends_at IS
  'Date de fin d''accès après annulation (Stripe cancel_at). Si NULL → pas annulé. '
  'Tant que subscription_ends_at > NOW(), l''utilisateur garde l''accès même si status=cancelled.';


-- -----------------------------------------------------------------------------
-- 2. migration_gift_* : traçabilité des cadeaux de migration (Étape 6)
--    sans polluer extra_purchases avec des entries fictives.
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'migration_gift_credits'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN migration_gift_credits INT NOT NULL DEFAULT 0
      CONSTRAINT chk_migration_gift_non_negative CHECK (migration_gift_credits >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'migration_gift_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN migration_gift_at TIMESTAMPTZ;
  END IF;
END $$;

COMMENT ON COLUMN profiles.migration_gift_credits IS
  'Nombre de crédits offerts lors de la migration v2 (Étape 6). Inclus dans extra_balance.';
COMMENT ON COLUMN profiles.migration_gift_at IS
  'Date d''octroi du cadeau de migration. NULL si pas de cadeau.';


-- -----------------------------------------------------------------------------
-- 3. Nettoyage des entries fictives "migration_gift_*" insérées par l'ancienne
--    version de migrate-existing-users.ts (si déjà exécuté en prod).
-- -----------------------------------------------------------------------------

DELETE FROM extra_purchases
 WHERE stripe_payment_intent_id LIKE 'migration_gift_%';
