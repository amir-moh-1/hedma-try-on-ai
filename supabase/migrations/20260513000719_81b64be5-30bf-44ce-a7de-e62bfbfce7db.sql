-- Merchants table (each merchant = a shop, owned by a vendor user)
CREATE TABLE public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  shop_name TEXT NOT NULL,
  whatsapp TEXT,
  location TEXT,
  logo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchants public read active" ON public.merchants
  FOR SELECT USING (active = true OR owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin manage merchants" ON public.merchants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "owner update own merchant" ON public.merchants
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER trg_merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Add merchant_id + variants JSONB to products
ALTER TABLE public.products
  ADD COLUMN merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  ADD COLUMN variants JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX idx_products_merchant ON public.products(merchant_id);

-- Admin-defined preset sizes/colors/categories for fast input chips
CREATE TABLE public.input_presets (
  id TEXT NOT NULL PRIMARY KEY,  -- 'sizes' | 'colors' | 'categories'
  values JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.input_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presets public read" ON public.input_presets
  FOR SELECT USING (true);

CREATE POLICY "admin manage presets" ON public.input_presets
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.input_presets (id, values) VALUES
  ('sizes', '["S","M","L","XL","2XL","3XL","38","39","40","41","42","43","44"]'::jsonb),
  ('colors', '["أبيض","أسود","أحمر","أزرق","أخضر","أصفر","رمادي","بني","وردي","بيج","كحلي"]'::jsonb),
  ('categories', '["تيشيرتات","قمصان","بناطيل","كوتشيات","شنط","إكسسوارات"]'::jsonb);
