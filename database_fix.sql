-- Hedma SQL Fix: Complete Database Schema and Enhancements Initializer
-- Run this in Supabase SQL Editor to resolve all errors and enable premium features.

-- 1. Create app_role Type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'customer');
    END IF;
END $$;

-- 2. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create site_settings table if it doesn't exist
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

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 5. Apply table column enhancements inside a safe DO block
DO $$ 
BEGIN
    -- Site Settings Enhancements
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

    -- Profiles Table Enhancements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_banned') THEN
        ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='plain_password') THEN
        ALTER TABLE public.profiles ADD COLUMN plain_password TEXT;
    END IF;
END $$;

-- 6. Ensure singleton record exists in site_settings
INSERT INTO public.site_settings (id) VALUES ('main') 
ON CONFLICT (id) DO NOTHING;

-- 7. Set default values for existing rows if needed
UPDATE public.site_settings SET marquee_visible = TRUE WHERE marquee_visible IS NULL;
UPDATE public.site_settings SET social_proof_enabled = TRUE WHERE social_proof_enabled IS NULL;
UPDATE public.profiles SET is_banned = FALSE WHERE is_banned IS NULL;


-- 8. Password Recovery Requests Table
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


-- 9. Notifications Table
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


-- 10. Admin Update User Function (SECURITY DEFINER)
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


-- 11. Enable new columns in password_recovery_requests
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='password_recovery_requests' AND column_name='method') THEN
        ALTER TABLE public.password_recovery_requests ADD COLUMN method TEXT DEFAULT 'whatsapp';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='password_recovery_requests' AND column_name='email') THEN
        ALTER TABLE public.password_recovery_requests ADD COLUMN email TEXT;
    END IF;
END $$;


-- 12. Create user_notifications Table
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


-- 13. Create RLS Policies for Profiles if missing to ensure admin has access
DROP POLICY IF EXISTS "profiles read all authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
DROP POLICY IF EXISTS "admin all profiles" ON public.profiles;

CREATE POLICY "profiles read all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "admin all profiles" ON public.profiles FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    ) 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );


-- 14. Create RLS Policies for User Roles if missing
DROP POLICY IF EXISTS "roles read own" ON public.user_roles;
DROP POLICY IF EXISTS "admin manage roles" ON public.user_roles;

CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );
