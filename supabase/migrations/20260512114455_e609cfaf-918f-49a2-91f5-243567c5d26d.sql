
create table public.site_settings (
  id text primary key default 'main',
  whatsapp text not null default '201229344711',
  email text not null default 'hedma.tk@gmail.com',
  instagram_url text default '',
  facebook_url text default '',
  tiktok_url text default '',
  address text default 'التل الكبير، الإسماعيلية',
  quick_links jsonb not null default '[
    {"label":"الرئيسية","to":"/"},
    {"label":"المنتجات","to":"/products"},
    {"label":"جرّب بالـ AI","to":"/try-on"},
    {"label":"زبايننا","to":"/customers"},
    {"label":"قصتنا","to":"/our-story"}
  ]'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values ('main') on conflict do nothing;

alter table public.site_settings enable row level security;
create policy "settings public read" on public.site_settings for select using (true);
create policy "admin update settings" on public.site_settings for update to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
create policy "admin insert settings" on public.site_settings for insert to authenticated
  with check (has_role(auth.uid(),'admin'));

create type public.order_status as enum ('pending','approved','assigned','in_transit','delivered','cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  customer_name text,
  customer_phone text,
  customer_address text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  discount numeric not null default 0,
  coupon_code text,
  status order_status not null default 'pending',
  delivery_agent_id uuid,
  tracking_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders read own or assigned or admin" on public.orders for select to authenticated
  using (customer_id = auth.uid() or delivery_agent_id = auth.uid() or has_role(auth.uid(),'admin'));
create policy "orders customer insert own" on public.orders for insert to authenticated
  with check (customer_id = auth.uid());
create policy "orders admin all" on public.orders for all to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
create policy "orders delivery update assigned" on public.orders for update to authenticated
  using (delivery_agent_id = auth.uid() and has_role(auth.uid(),'delivery'))
  with check (delivery_agent_id = auth.uid() and has_role(auth.uid(),'delivery'));

create trigger orders_touch before update on public.orders
for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.site_settings
for each row execute function public.touch_updated_at();
