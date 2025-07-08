-- Migration pour ajouter la table de cache des guidances OpenAI
-- Cette table évite de régénérer la même guidance pour la même combinaison thème natal + transits

CREATE TABLE IF NOT EXISTS guidance_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  guidance_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches par clé de cache
CREATE INDEX IF NOT EXISTS idx_guidance_cache_key ON guidance_cache(cache_key);

-- Index pour optimiser les recherches JSONB
CREATE INDEX IF NOT EXISTS idx_guidance_cache_data ON guidance_cache USING GIN (guidance_data);

-- Index pour le nettoyage automatique (supprimer les anciennes entrées)
CREATE INDEX IF NOT EXISTS idx_guidance_cache_created_at ON guidance_cache(created_at);

-- RLS (Row Level Security) - lecture publique, écriture par les fonctions
ALTER TABLE guidance_cache ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique (pour les fonctions Netlify)
CREATE POLICY "Allow public read access to guidance_cache" ON guidance_cache
  FOR SELECT USING (true);

-- Politique : écriture par les fonctions Netlify (via service role)
CREATE POLICY "Allow service role write access to guidance_cache" ON guidance_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update access to guidance_cache" ON guidance_cache
  FOR UPDATE USING (true);

-- Commentaire pour documenter l'usage
COMMENT ON TABLE guidance_cache IS 'Cache des guidances générées par OpenAI pour éviter les appels redondants';
COMMENT ON COLUMN guidance_cache.cache_key IS 'Clé unique basée sur la date, le thème natal et les transits';
COMMENT ON COLUMN guidance_cache.guidance_data IS 'Données JSON de la guidance générée (summary, love, work, energy, mantra)';

-- Fonction pour nettoyer automatiquement les anciennes entrées (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_guidance_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM guidance_cache 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Déclencher le nettoyage automatique (optionnel, peut être exécuté manuellement)
-- SELECT cleanup_old_guidance_cache(); 