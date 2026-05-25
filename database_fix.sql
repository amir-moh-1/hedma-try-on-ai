-- Hedma SQL Fix: COMPLETE MASTER SCHEMA INITIALIZER (v9 Ultimate Edition)
-- Run this in Supabase SQL Editor to resolve all errors and initialize a completely fresh or empty database.

-- =========================================================================
-- 1. ENUMS AND CORE TYPES
-- =========================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'customer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('pending','approved','assigned','in_transit','delivered','cancelled');
    END IF;
END $$;


-- =========================================================================
-- 2. CORE HELPER FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;


-- =========================================================================
-- 3. SCHEMA TABLES CREATION (CREATE IF NOT EXISTS)
-- =========================================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  email TEXT,
  plain_password TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Merchants / Shops
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  shop_name TEXT NOT NULL,
  whatsapp TEXT,
  location TEXT,
  logo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  merchant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL DEFAULT 'other',
  location TEXT,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] NOT NULL DEFAULT '{}',
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  variants JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  percent INT NOT NULL CHECK (percent BETWEEN 1 AND 90),
  message TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

-- Customer Photos (Social Proof)
CREATE TABLE IF NOT EXISTS public.customer_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Offers
CREATE TABLE IF NOT EXISTS public.product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  title TEXT NOT NULL DEFAULT 'عرض خاص',
  percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 90),
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  whatsapp TEXT NOT NULL DEFAULT '201229344711',
  email TEXT NOT NULL DEFAULT 'hedma.tk@gmail.com',
  instagram_url TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  address TEXT DEFAULT 'التل الكبير، الإسماعيلية',
  logo_url TEXT,
  slogan TEXT,
  marquee_text TEXT,
  marquee_visible BOOLEAN DEFAULT TRUE,
  shipping_text TEXT,
  fast_shipping_text TEXT,
  social_proof_enabled BOOLEAN DEFAULT TRUE,
  social_proof_real_data BOOLEAN DEFAULT FALSE,
  quick_links JSONB NOT NULL DEFAULT '[
    {"label":"الرئيسية","to":"/"},
    {"label":"المنتجات","to":"/products"},
    {"label":"جرّب بالـ AI","to":"/try-on"},
    {"label":"زبايننا","to":"/customers"},
    {"label":"قصتنا","to":"/our-story"}
  ]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  total NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  coupon_code TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  delivery_agent_id UUID,
  tracking_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Input Presets
CREATE TABLE IF NOT EXISTS public.input_presets (
  id TEXT NOT NULL PRIMARY KEY,
  values JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- Password Recovery Requests
CREATE TABLE IF NOT EXISTS public.password_recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  method TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications (Global/Admin)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Notifications (Specific Per User)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =========================================================================
-- 4. APPLY SCHEMA ENHANCEMENTS AND ALTERS SAFELY
-- =========================================================================
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    -- Products Table Enhancements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='merchant_id') THEN
        ALTER TABLE public.products ADD COLUMN merchant_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='variants') THEN
        ALTER TABLE public.products ADD COLUMN variants JSONB NOT NULL DEFAULT '[]'::JSONB;
    END IF;

    -- Password Recovery Table Enhancements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='password_recovery_requests' AND column_name='method') THEN
        ALTER TABLE public.password_recovery_requests ADD COLUMN method TEXT DEFAULT 'whatsapp';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='password_recovery_requests' AND column_name='email') THEN
        ALTER TABLE public.password_recovery_requests ADD COLUMN email TEXT;
    END IF;
END $$;


-- =========================================================================
-- 5. TRIGGER TRIGGERS AND SYSTEM TRIGGERS FUNCTIONS
-- =========================================================================

-- Touch Triggers
DROP TRIGGER IF EXISTS products_updated ON public.products;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_merchants_updated_at ON public.merchants;
CREATE TRIGGER trg_merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS orders_touch ON public.orders;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS settings_touch ON public.site_settings;
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto Profile Trigger Function on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, phone, email, plain_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    NEW.raw_user_meta_data->>'plain_password'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================================
-- 6. SYSTEM SEEDS (IDEMPOTENT)
-- =========================================================================

-- site_settings singleton
INSERT INTO public.site_settings (id) VALUES ('main') 
ON CONFLICT (id) DO NOTHING;

UPDATE public.site_settings SET marquee_visible = TRUE WHERE marquee_visible IS NULL;
UPDATE public.site_settings SET social_proof_enabled = TRUE WHERE social_proof_enabled IS NULL;
UPDATE public.profiles SET is_banned = FALSE WHERE is_banned IS NULL;

-- default input presets
INSERT INTO public.input_presets (id, values) VALUES
  ('sizes', '["S","M","L","XL","2XL","3XL","38","39","40","41","42","43","44"]'::JSONB),
  ('colors', '["أبيض","أسود","أحمر","أزرق","أخضر","أصفر","رمادي","بني","وردي","بيج","كحلي"]'::JSONB),
  ('categories', '["تيشيرتات","قمصان","بناطيل","كوتشيات","شنط","إكسسوارات"]'::JSONB)
ON CONFLICT (id) DO UPDATE SET values = EXCLUDED.values;

-- default categories
INSERT INTO public.categories (name, slug, icon) VALUES
  ('تيشيرتات','tshirts','👕'),
  ('بناطيل','pants','👖'),
  ('كوتشيات','shoes','👟'),
  ('إكسسوارات','accessories','🎒'),
  ('قمصان','shirts','👔')
ON CONFLICT (slug) DO NOTHING;


-- =========================================================================
-- 7. ADMIN UPDATE USER DEFINED FUNCTION
-- =========================================================================
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


-- =========================================================================
-- 8. SECURITY ROW LEVEL SECURITY (RLS) POLICIES CREATION
-- =========================================================================

-- Profiles
DROP POLICY IF EXISTS "profiles read all authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
DROP POLICY IF EXISTS "admin all profiles" ON public.profiles;

CREATE POLICY "profiles read all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "admin all profiles" ON public.profiles FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) 
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- User Roles
DROP POLICY IF EXISTS "roles read own" ON public.user_roles;
DROP POLICY IF EXISTS "admin manage roles" ON public.user_roles;

CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated 
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Merchants
DROP POLICY IF EXISTS "merchants public read active" ON public.merchants;
DROP POLICY IF EXISTS "admin manage merchants" ON public.merchants;
DROP POLICY IF EXISTS "owner update own merchant" ON public.merchants;

CREATE POLICY "merchants public read active" ON public.merchants FOR SELECT USING (active = true OR owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "admin manage merchants" ON public.merchants FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "owner update own merchant" ON public.merchants FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Products
DROP POLICY IF EXISTS "products public read active" ON public.products;
DROP POLICY IF EXISTS "vendors insert own products" ON public.products;
DROP POLICY IF EXISTS "vendors update own products" ON public.products;
DROP POLICY IF EXISTS "vendors delete own products" ON public.products;

CREATE POLICY "products public read active" ON public.products FOR SELECT USING (active = true OR vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "vendors insert own products" ON public.products FOR INSERT TO authenticated WITH CHECK (vendor_id = auth.uid() AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('vendor','admin'))));
CREATE POLICY "vendors update own products" ON public.products FOR UPDATE TO authenticated USING (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "vendors delete own products" ON public.products FOR DELETE TO authenticated USING (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Coupons
DROP POLICY IF EXISTS "users read own coupons" ON public.coupons;
DROP POLICY IF EXISTS "admin manage coupons" ON public.coupons;

CREATE POLICY "users read own coupons" ON public.coupons FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "admin manage coupons" ON public.coupons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Activity Logs
DROP POLICY IF EXISTS "users insert own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "users read own logs" ON public.activity_logs;

CREATE POLICY "users insert own logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users read own logs" ON public.activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Product Reviews
DROP POLICY IF EXISTS "reviews public read" ON public.product_reviews;
DROP POLICY IF EXISTS "users add own review" ON public.product_reviews;
DROP POLICY IF EXISTS "users update own review" ON public.product_reviews;
DROP POLICY IF EXISTS "users delete own review or admin" ON public.product_reviews;

CREATE POLICY "reviews public read" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "users add own review" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own review" ON public.product_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users delete own review or admin" ON public.product_reviews FOR DELETE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Customer Photos
DROP POLICY IF EXISTS "customer photos public read approved" ON public.customer_photos;
DROP POLICY IF EXISTS "users insert own photo" ON public.customer_photos;
DROP POLICY IF EXISTS "users delete own photo or admin" ON public.customer_photos;
DROP POLICY IF EXISTS "admin update photos" ON public.customer_photos;

CREATE POLICY "customer photos public read approved" ON public.customer_photos FOR SELECT USING (approved = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "users insert own photo" ON public.customer_photos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND consent = true);
CREATE POLICY "users delete own photo or admin" ON public.customer_photos FOR DELETE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "admin update photos" ON public.customer_photos FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Product Offers
DROP POLICY IF EXISTS "offers public read active" ON public.product_offers;
DROP POLICY IF EXISTS "admin manage offers" ON public.product_offers;

CREATE POLICY "offers public read active" ON public.product_offers FOR SELECT USING (active = true AND ends_at > NOW() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "admin manage offers" ON public.product_offers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Site Settings
DROP POLICY IF EXISTS "settings public read" ON public.site_settings;
DROP POLICY IF EXISTS "admin update settings" ON public.site_settings;
DROP POLICY IF EXISTS "admin insert settings" ON public.site_settings;

CREATE POLICY "settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admin update settings" ON public.site_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "admin insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Orders
DROP POLICY IF EXISTS "orders read own or assigned or admin" ON public.orders;
DROP POLICY IF EXISTS "orders customer insert own" ON public.orders;
DROP POLICY IF EXISTS "orders admin all" ON public.orders;
DROP POLICY IF EXISTS "orders delivery update assigned" ON public.orders;

CREATE POLICY "orders read own or assigned or admin" ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid() OR delivery_agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "orders customer insert own" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "orders admin all" ON public.orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "orders delivery update assigned" ON public.orders FOR UPDATE TO authenticated USING (delivery_agent_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'delivery')) WITH CHECK (delivery_agent_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'delivery'));

-- Input Presets
DROP POLICY IF EXISTS "presets public read" ON public.input_presets;
DROP POLICY IF EXISTS "admin manage presets" ON public.input_presets;

CREATE POLICY "presets public read" ON public.input_presets FOR SELECT USING (true);
CREATE POLICY "admin manage presets" ON public.input_presets FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Categories
DROP POLICY IF EXISTS "categories public read" ON public.categories;
DROP POLICY IF EXISTS "categories admin manage" ON public.categories;

CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (active = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "categories admin manage" ON public.categories FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Wishlist
DROP POLICY IF EXISTS "wishlist owner read" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist owner insert" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist owner delete" ON public.wishlist;

CREATE POLICY "wishlist owner read" ON public.wishlist FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "wishlist owner insert" ON public.wishlist FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "wishlist owner delete" ON public.wishlist FOR DELETE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Password Recovery Requests
DROP POLICY IF EXISTS "Allow public inserts" ON public.password_recovery_requests;
DROP POLICY IF EXISTS "Allow admin read/write" ON public.password_recovery_requests;

CREATE POLICY "Allow public inserts" ON public.password_recovery_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read/write" ON public.password_recovery_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Notifications
DROP POLICY IF EXISTS "Allow authenticated read" ON public.notifications;
DROP POLICY IF EXISTS "Allow public insert" ON public.notifications;
DROP POLICY IF EXISTS "Allow admin all" ON public.notifications;

CREATE POLICY "Allow authenticated read" ON public.notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin all" ON public.notifications FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- User Notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.user_notifications;

CREATE POLICY "Users can read own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);


-- =========================================================================
-- 9. SYSTEM BUCKETS INITIALIZATION
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('hedma', 'hedma', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-photos','customer-photos', true) ON CONFLICT (id) DO NOTHING;

-- Storage object policies
DROP POLICY IF EXISTS "hedma public read" ON storage.objects;
DROP POLICY IF EXISTS "hedma authed write" ON storage.objects;
DROP POLICY IF EXISTS "hedma owner update" ON storage.objects;
DROP POLICY IF EXISTS "hedma owner delete" ON storage.objects;

CREATE POLICY "hedma public read" ON storage.objects FOR SELECT USING (bucket_id = 'hedma');
CREATE POLICY "hedma authed write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hedma');
CREATE POLICY "hedma owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hedma' AND owner = auth.uid());
CREATE POLICY "hedma owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hedma' AND owner = auth.uid());

DROP POLICY IF EXISTS "customer photos read" ON storage.objects;
DROP POLICY IF EXISTS "customer photos upload own" ON storage.objects;
DROP POLICY IF EXISTS "customer photos delete own or admin" ON storage.objects;

CREATE POLICY "customer photos read" ON storage.objects FOR SELECT USING (bucket_id = 'customer-photos');
CREATE POLICY "customer photos upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'customer-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "customer photos delete own or admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'customer-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')));


-- =========================================================================
-- 10. REALTIME PUBLICATIONS AND SYSTEM CACHE FLUSH
-- =========================================================================
DO $$ 
BEGIN
    -- Add tables to realtime publication if they aren't already added
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN OTHERS THEN 
    -- Ignore duplicate table in publication errors
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
EXCEPTION WHEN OTHERS THEN 
    -- Ignore
END $$;

-- Force reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
