-- Migration pour ajouter le champ avatar_url à la table profiles
ALTER TABLE profiles
ADD COLUMN avatar_url TEXT;

-- Optionnel : commentaire pour la documentation
COMMENT ON COLUMN profiles.avatar_url IS 'URL de la photo de profil utilisateur (hébergée sur Supabase Storage ou autre)'; 