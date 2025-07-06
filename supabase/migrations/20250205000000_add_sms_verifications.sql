-- Create sms_verifications table
CREATE TABLE IF NOT EXISTS sms_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_verifications_phone_code ON sms_verifications(phone, code);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_expires_at ON sms_verifications(expires_at);

-- Add RLS policies
ALTER TABLE sms_verifications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (in production, you might want to restrict this)
CREATE POLICY "Allow all operations on sms_verifications" ON sms_verifications
  FOR ALL USING (true);

-- Clean up expired codes function
CREATE OR REPLACE FUNCTION cleanup_expired_sms_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM sms_verifications 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired codes (optional)
-- SELECT cron.schedule('cleanup-sms-codes', '0 */6 * * *', 'SELECT cleanup_expired_sms_codes();'); 