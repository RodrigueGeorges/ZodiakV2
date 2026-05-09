-- =========================================================================
-- Migration : enrichir daily_guidance avec un 4ème pilier (money) +
-- une boussole du jour (dos / donts) + un mantra personnalisé.
--
-- Backward-compatible : toutes les nouvelles colonnes sont NULLABLE.
-- Les guidances historiques continuent à fonctionner sans changement
-- côté UI (les sections vides ne s'affichent simplement pas).
-- =========================================================================

ALTER TABLE daily_guidance
  ADD COLUMN IF NOT EXISTS money  text,
  ADD COLUMN IF NOT EXISTS mantra text,
  ADD COLUMN IF NOT EXISTS dos    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS donts  jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN daily_guidance.money  IS '4ème pilier optionnel — finances. Null pour les guidances pré-migration.';
COMMENT ON COLUMN daily_guidance.mantra IS 'Phrase courte personnalisée préfixée du prénom de l''utilisateur.';
COMMENT ON COLUMN daily_guidance.dos    IS 'Tableau JSON de 3 actions à privilégier (≤ 12 mots chacune).';
COMMENT ON COLUMN daily_guidance.donts  IS 'Tableau JSON de 3 actions à éviter (≤ 12 mots chacune).';
