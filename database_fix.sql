-- 1. Update site_settings table with new branding and UI columns
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS slogan TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS marquee_text TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS marquee_visible BOOLEAN DEFAULT TRUE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS shipping_text TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS fast_shipping_text TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_proof_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_proof_real_data BOOLEAN DEFAULT FALSE;

-- 2. Update profiles table for advanced admin controls
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plain_password TEXT; -- Used only for admin visibility as requested

-- 3. Ensure a 'main' settings record exists
INSERT INTO site_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;
