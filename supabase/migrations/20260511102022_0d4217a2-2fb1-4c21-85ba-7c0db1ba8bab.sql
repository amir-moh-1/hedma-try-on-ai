-- 1) Product reviews
create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
alter table public.product_reviews enable row level security;

create policy "reviews public read" on public.product_reviews
  for select to public using (true);
create policy "users add own review" on public.product_reviews
  for insert to authenticated with check (user_id = auth.uid());
create policy "users update own review" on public.product_reviews
  for update to authenticated using (user_id = auth.uid());
create policy "users delete own review or admin" on public.product_reviews
  for delete to authenticated using (user_id = auth.uid() or has_role(auth.uid(),'admin'));

-- 2) Customer photos (social proof)
create table public.customer_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  image_url text not null,
  caption text,
  consent boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.customer_photos enable row level security;

create policy "customer photos public read approved" on public.customer_photos
  for select to public using (approved = true or user_id = auth.uid() or has_role(auth.uid(),'admin'));
create policy "users insert own photo" on public.customer_photos
  for insert to authenticated with check (user_id = auth.uid() and consent = true);
create policy "users delete own photo or admin" on public.customer_photos
  for delete to authenticated using (user_id = auth.uid() or has_role(auth.uid(),'admin'));
create policy "admin update photos" on public.customer_photos
  for update to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- 3) Product offers / timed deals
create table public.product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,                         -- null = applies to all products
  title text not null default 'عرض خاص',
  percent integer not null check (percent between 1 and 90),
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.product_offers enable row level security;

create policy "offers public read active" on public.product_offers
  for select to public using (active = true and ends_at > now() or has_role(auth.uid(),'admin'));
create policy "admin manage offers" on public.product_offers
  for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- 4) Storage bucket for customer photos
insert into storage.buckets (id, name, public) values ('customer-photos','customer-photos', true)
  on conflict (id) do nothing;

create policy "customer photos read" on storage.objects
  for select to public using (bucket_id = 'customer-photos');
create policy "customer photos upload own" on storage.objects
  for insert to authenticated with check (bucket_id = 'customer-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "customer photos delete own or admin" on storage.objects
  for delete to authenticated using (bucket_id = 'customer-photos' and (auth.uid()::text = (storage.foldername(name))[1] or has_role(auth.uid(),'admin')));