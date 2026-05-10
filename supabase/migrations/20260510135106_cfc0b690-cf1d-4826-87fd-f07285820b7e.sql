-- Roles enum
create type public.app_role as enum ('admin', 'vendor', 'customer');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category text not null default 'other',
  location text,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock int not null default 0 check (stock >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_updated before update on public.products
  for each row execute function public.touch_updated_at();

-- Coupons (per user)
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  percent int not null check (percent between 1 and 90),
  message text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;

-- Activity logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;

-- RLS: profiles
create policy "profiles read all authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "admin all profiles" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- RLS: user_roles
create policy "roles read own" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- RLS: products
create policy "products public read active" on public.products for select using (active = true or vendor_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "vendors insert own products" on public.products for insert to authenticated
  with check (vendor_id = auth.uid() and (public.has_role(auth.uid(),'vendor') or public.has_role(auth.uid(),'admin')));
create policy "vendors update own products" on public.products for update to authenticated
  using (vendor_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (vendor_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "vendors delete own products" on public.products for delete to authenticated
  using (vendor_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- RLS: coupons
create policy "users read own coupons" on public.coupons for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin manage coupons" on public.coupons for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- RLS: activity_logs
create policy "users insert own logs" on public.activity_logs for insert to authenticated
  with check (user_id = auth.uid());
create policy "users read own logs" on public.activity_logs for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- Auto-create profile + customer role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  ) on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'customer')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Storage bucket for images
insert into storage.buckets (id, name, public) values ('hedma', 'hedma', true)
on conflict (id) do nothing;

create policy "hedma public read" on storage.objects for select using (bucket_id = 'hedma');
create policy "hedma authed write" on storage.objects for insert to authenticated
  with check (bucket_id = 'hedma');
create policy "hedma owner update" on storage.objects for update to authenticated
  using (bucket_id = 'hedma' and owner = auth.uid());
create policy "hedma owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'hedma' and owner = auth.uid());

-- Realtime
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.coupons;