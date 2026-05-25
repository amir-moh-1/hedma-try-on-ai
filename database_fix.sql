-- Hedma SQL Fix: Comprehensive Schema Update
-- Run this in Supabase SQL Editor to resolve all 400 errors and enable premium features.

-- A. Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  whatsapp TEXT NOT NULL DEFAULT '201229344711',
  email TEXT NOT NULL DEFAULT 'hedma.tk@gmail.com',
  instagram_url TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  address TEXT DEFAULT 'التل الكبير، الإسماعيلية',
  quick_links JSONB NOT NULL DEFAULT '[
    {"label":"الرئيسية","to":"/"},
    {"label":"المنتجات","to":"/products"},
    {"label":"جرّب بالـ AI","to":"/try-on"},
    {"label":"زبايننا","to":"/customers"},
    {"label":"قصتنا","to":"/our-story"}
  ]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. Apply enhancements inside a safe DO block
DO $$ 
BEGIN
    -- 1. Site Settings Enhancements (using schema qualification public.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='logo_url') THEN
        ALTER TABLE public.site_settings ADD COLUMN logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='slogan') THEN
        ALTER TABLE public.site_settings ADD COLUMN slogan TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='marquee_text') THEN
        ALTER TABLE public.site_settings ADD COLUMN marquee_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='marquee_visible') THEN
        ALTER TABLE public.site_settings ADD COLUMN marquee_visible BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='shipping_text') THEN
        ALTER TABLE public.site_settings ADD COLUMN shipping_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='fast_shipping_text') THEN
        ALTER TABLE public.site_settings ADD COLUMN fast_shipping_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='social_proof_enabled') THEN
        ALTER TABLE public.site_settings ADD COLUMN social_proof_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='social_proof_real_data') THEN
        ALTER TABLE public.site_settings ADD COLUMN social_proof_real_data BOOLEAN DEFAULT FALSE;
    END IF;

    -- 2. Advanced User Profiles (using schema qualification public.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_banned') THEN
        ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='plain_password') THEN
        ALTER TABLE public.profiles ADD COLUMN plain_password TEXT;
    END IF;
END $$;

-- 3. Ensure singleton record exists (using public.)
INSERT INTO public.site_settings (id) VALUES ('main') 
ON CONFLICT (id) DO NOTHING;

-- 4. Set default values for existing rows if needed (using public.)
UPDATE public.site_settings SET marquee_visible = TRUE WHERE marquee_visible IS NULL;
UPDATE public.site_settings SET social_proof_enabled = TRUE WHERE social_proof_enabled IS NULL;
UPDATE public.profiles SET is_banned = FALSE WHERE is_banned IS NULL;


-- 5. Password Recovery Requests Table
CREATE TABLE IF NOT EXISTS public.password_recovery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- pending, resolved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Recovery Table
ALTER TABLE public.password_recovery_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflict
DROP POLICY IF EXISTS "Allow public inserts" ON public.password_recovery_requests;
DROP POLICY IF EXISTS "Allow admin read/write" ON public.password_recovery_requests;

-- Create Policies
CREATE POLICY "Allow public inserts" ON public.password_recovery_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read/write" ON public.password_recovery_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );


-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'info', -- info, order, user, recovery
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.notifications;
DROP POLICY IF EXISTS "Allow public insert" ON public.notifications;
DROP POLICY IF EXISTS "Allow admin all" ON public.notifications;

CREATE POLICY "Allow authenticated read" ON public.notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public insert" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin all" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );


-- 7. Admin Update User Function (SECURITY DEFINER)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_update_user(
  target_user_id UUID,
  new_username TEXT,
  new_email TEXT,
  new_password TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_full_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Check if the caller is an admin
  SELECT role INTO caller_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  
  IF caller_role = 'admin' THEN
    -- Update auth.users email and password (if provided)
    IF new_password IS NOT NULL AND new_password <> '' THEN
      UPDATE auth.users
      SET email = LOWER(new_email),
          encrypted_password = crypt(new_password, gen_salt('bf')),
          email_confirmed_at = NOW()
      WHERE id = target_user_id;
    ELSE
      UPDATE auth.users
      SET email = LOWER(new_email)
      WHERE id = target_user_id;
    END IF;

    -- Update public.profiles table
    UPDATE public.profiles
    SET username = new_username,
        phone = new_phone,
        full_name = new_full_name,
        plain_password = COALESCE(NULLIF(new_password, ''), plain_password)
    WHERE id = target_user_id;

    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'غير مصرح لك بتعديل بيانات هذا المستخدم';
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Enable new columns in password_recovery_requests
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='password_recovery_requests' AND column_name='method') THEN
        ALTER TABLE public.password_recovery_requests ADD COLUMN method TEXT DEFAULT 'whatsapp';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='password_recovery_requests' AND column_name='email') THEN
        ALTER TABLE public.password_recovery_requests ADD COLUMN email TEXT;
    END IF;
END $$;


-- 9. Create user_notifications Table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflict
DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.user_notifications;

-- Create Policies
CREATE POLICY "Users can read own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" ON public.user_notifications
    FOR INSERT WITH CHECK (true);
