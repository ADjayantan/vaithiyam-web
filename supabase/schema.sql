-- Vaithiyam Supabase schema
-- Run in the Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  mobile text,
  role text not null default 'customer' check (role in ('customer','admin')),
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name_ta text not null,
  name_en text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists medicines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ta text not null,
  name_en text not null,
  category_id uuid references categories(id) on delete set null,
  tradition text not null,
  price numeric not null,
  mrp numeric not null,
  rating numeric default 0,
  review_count int default 0,
  stock_count int default 0,
  in_stock boolean default true,
  prescription_required boolean default false,
  image_url text,
  overview text,
  ingredients text,
  general_uses text,
  safety_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  qty int not null check (qty > 0),
  created_at timestamptz not null default now(),
  unique (user_id, medicine_id)
);

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, medicine_id)
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null,
  subtotal numeric not null,
  delivery_fee numeric not null default 0,
  total numeric not null,
  address_id uuid references addresses(id) on delete set null,
  payment_method text not null,
  prescription_status text default 'not_required',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  medicine_id uuid references medicines(id) on delete set null,
  qty int not null check (qty > 0),
  price numeric not null
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_url text,
  status text not null default 'pending_review',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table medicines enable row level security;
alter table cart_items enable row level security;
alter table wishlist_items enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table prescriptions enable row level security;
alter table reviews enable row level security;

drop policy if exists "profiles select own or admin" on profiles;
create policy "profiles select own or admin" on profiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists "profiles update own or admin" on profiles;
create policy "profiles update own or admin" on profiles
  for update using (auth.uid() = id or is_admin());

drop policy if exists "categories readable by customers" on categories;
create policy "categories readable by customers" on categories
  for select using (true);

drop policy if exists "categories admin manage" on categories;
create policy "categories admin manage" on categories
  for all using (is_admin()) with check (is_admin());

drop policy if exists "medicines readable by customers" on medicines;
create policy "medicines readable by customers" on medicines
  for select using (true);

drop policy if exists "medicines admin manage" on medicines;
create policy "medicines admin manage" on medicines
  for all using (is_admin()) with check (is_admin());

drop policy if exists "cart manage own" on cart_items;
create policy "cart manage own" on cart_items
  for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id or is_admin());

drop policy if exists "wishlist manage own" on wishlist_items;
create policy "wishlist manage own" on wishlist_items
  for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id or is_admin());

drop policy if exists "addresses manage own" on addresses;
create policy "addresses manage own" on addresses
  for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id or is_admin());

drop policy if exists "orders select own or admin" on orders;
create policy "orders select own or admin" on orders
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists "orders insert own" on orders;
create policy "orders insert own" on orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "orders admin update" on orders;
create policy "orders admin update" on orders
  for update using (is_admin()) with check (is_admin());

drop policy if exists "order items select own order or admin" on order_items;
create policy "order items select own order or admin" on order_items
  for select using (
    is_admin()
    or exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

drop policy if exists "order items insert own order" on order_items;
create policy "order items insert own order" on order_items
  for insert with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

drop policy if exists "prescriptions manage own or admin" on prescriptions;
create policy "prescriptions manage own or admin" on prescriptions
  for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id or is_admin());

drop policy if exists "reviews manage own or admin" on reviews;
create policy "reviews manage own or admin" on reviews
  for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id or is_admin());
