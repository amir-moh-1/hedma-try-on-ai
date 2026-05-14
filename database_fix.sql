-- Hedma SQL Fix: Comprehensive Schema Update
-- Run this in Supabase SQL Editor to resolve all 400 errors and enable premium features.

DO $$ 
BEGIN
    -- 1. Site Settings Enhancements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='logo_url') THEN
        ALTER TABLE site_settings ADD COLUMN logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='slogan') THEN
        ALTER TABLE site_settings ADD COLUMN slogan TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='marquee_text') THEN
        ALTER TABLE site_settings ADD COLUMN marquee_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='marquee_visible') THEN
        ALTER TABLE site_settings ADD COLUMN marquee_visible BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='shipping_text') THEN
        ALTER TABLE site_settings ADD COLUMN shipping_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='fast_shipping_text') THEN
        ALTER TABLE site_settings ADD COLUMN fast_shipping_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='social_proof_enabled') THEN
        ALTER TABLE site_settings ADD COLUMN social_proof_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='social_proof_real_data') THEN
        ALTER TABLE site_settings ADD COLUMN social_proof_real_data BOOLEAN DEFAULT FALSE;
    END IF;

    -- 2. Advanced User Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_banned') THEN
        ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plain_password') THEN
        ALTER TABLE profiles ADD COLUMN plain_password TEXT;
    END IF;
END $$;

-- 3. Ensure singleton record exists
INSERT INTO site_settings (id) VALUES ('main') 
ON CONFLICT (id) DO NOTHING;

-- 4. Set default values for existing rows if needed
UPDATE site_settings SET marquee_visible = TRUE WHERE marquee_visible IS NULL;
UPDATE site_settings SET social_proof_enabled = TRUE WHERE social_proof_enabled IS NULL;
UPDATE profiles SET is_banned = FALSE WHERE is_banned IS NULL;
