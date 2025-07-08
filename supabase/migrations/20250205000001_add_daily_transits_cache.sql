-- Migration pour ajouter la table de cache des transits quotidiens
-- Cette table évite de recalculer les transits pour la même date

CREATE TABLE IF NOT EXISTS daily_transits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  transit_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches par date
CREATE INDEX IF NOT EXISTS idx_daily_transits_date ON daily_transits(date);

-- Index pour optimiser les recherches JSONB
CREATE INDEX IF NOT EXISTS idx_daily_transits_data ON daily_transits USING GIN (transit_data);

-- RLS (Row Level Security) - lecture publique, écriture par les fonctions
ALTER TABLE daily_transits ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique (pour les fonctions Netlify)
CREATE POLICY "Allow public read access to daily_transits" ON daily_transits
  FOR SELECT USING (true);

-- Politique : écriture par les fonctions Netlify (via service role)
CREATE POLICY "Allow service role write access to daily_transits" ON daily_transits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update access to daily_transits" ON daily_transits
  FOR UPDATE USING (true);

-- Commentaire pour documenter l'usage
COMMENT ON TABLE daily_transits IS 'Cache des transits planétaires quotidiens calculés via Prokerala API';
COMMENT ON COLUMN daily_transits.date IS 'Date des transits (YYYY-MM-DD)';
COMMENT ON COLUMN daily_transits.transit_data IS 'Données JSON des positions planétaires du jour'; 