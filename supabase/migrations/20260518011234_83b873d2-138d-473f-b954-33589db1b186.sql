
-- Add plain_password + is_banned + email columns to profiles for admin password recovery
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plain_password text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Categories table for admin-managed product categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "categories admin manage" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Seed default categories (idempotent)
INSERT INTO public.categories (name, slug, icon) VALUES
  ('تيشيرتات','tshirts','👕'),
  ('بناطيل','pants','👖'),
  ('كوتشيات','shoes','👟'),
  ('إكسسوارات','accessories','🎒'),
  ('قمصان','shirts','👔')
ON CONFLICT (slug) DO NOTHING;

-- Wishlist table per user
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist owner read" ON public.wishlist FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "wishlist owner insert" ON public.wishlist FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "wishlist owner delete" ON public.wishlist FOR DELETE TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- Update handle_new_user trigger to also save email + plain_password (insecure by user request)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, username, full_name, phone, email, plain_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email,
    new.raw_user_meta_data->>'plain_password'
  ) on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'customer')
  on conflict do nothing;
  return new;
end $function$;
