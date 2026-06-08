-- Add age field to profiles for theme defaulting
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+20';

-- OTP codes table for email verification
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signup',
  consumed BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.otp_codes TO authenticated;
GRANT ALL ON public.otp_codes TO service_role;
-- Allow anon to insert (signup flow before login) and select-for-update via service role
GRANT INSERT, SELECT, UPDATE ON public.otp_codes TO anon;

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Only service role / edge functions should normally touch this. Restrict client access.
CREATE POLICY "no_direct_select" ON public.otp_codes FOR SELECT TO authenticated, anon USING (false);
CREATE POLICY "no_direct_insert" ON public.otp_codes FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "no_direct_update" ON public.otp_codes FOR UPDATE TO authenticated, anon USING (false);

-- Index products by vendor for inventory dashboard
CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);