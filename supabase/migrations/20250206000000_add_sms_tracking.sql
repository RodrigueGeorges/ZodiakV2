-- Migration pour ajouter le tracking des ouvertures de SMS
-- Cette table permet de suivre les clics et ouvertures des liens SMS

CREATE TABLE IF NOT EXISTS sms_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  short_code VARCHAR(10) NOT NULL,
  token UUID NOT NULL,
  date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_sms_tracking_user_id ON sms_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_tracking_short_code ON sms_tracking(short_code);
CREATE INDEX IF NOT EXISTS idx_sms_tracking_token ON sms_tracking(token);
CREATE INDEX IF NOT EXISTS idx_sms_tracking_date ON sms_tracking(date);
CREATE INDEX IF NOT EXISTS idx_sms_tracking_opened ON sms_tracking(opened_at);

-- RLS (Row Level Security)
ALTER TABLE sms_tracking ENABLE ROW LEVEL SECURITY;

-- Politique : lecture par l'utilisateur propriétaire
CREATE POLICY "Users can view their own SMS tracking" ON sms_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Politique : écriture par les fonctions Netlify (via service role)
CREATE POLICY "Allow service role write access to sms_tracking" ON sms_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update access to sms_tracking" ON sms_tracking
  FOR UPDATE USING (true);

-- Commentaires pour documenter l'usage
COMMENT ON TABLE sms_tracking IS 'Tracking des ouvertures et clics sur les liens SMS de guidance';
COMMENT ON COLUMN sms_tracking.short_code IS 'Code court unique du lien SMS';
COMMENT ON COLUMN sms_tracking.token IS 'Token unique de sécurité';
COMMENT ON COLUMN sms_tracking.opened_at IS 'Timestamp de la première ouverture';
COMMENT ON COLUMN sms_tracking.clicked_at IS 'Timestamp du premier clic';
COMMENT ON COLUMN sms_tracking.user_agent IS 'User agent du navigateur';
COMMENT ON COLUMN sms_tracking.ip_address IS 'Adresse IP de l''utilisateur';

-- Fonction pour mettre à jour le timestamp de modification
CREATE OR REPLACE FUNCTION update_sms_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_sms_tracking_updated_at
  BEFORE UPDATE ON sms_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_tracking_updated_at(); 