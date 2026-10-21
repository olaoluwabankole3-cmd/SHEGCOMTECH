-- SHEGCOMTECH product catalogue and restricted admin access
-- Run once in the Supabase SQL Editor for this project.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique,
  sku text unique,
  brand text,
  category text not null,
  description text,
  price_ngn numeric(14,2) check (price_ngn is null or price_ngn >= 0),
  compare_at_price_ngn numeric(14,2) check (compare_at_price_ngn is null or compare_at_price_ngn >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  image_path text,
  badge text,
  is_featured boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_public_sort_idx
  on public.products (is_active, is_featured desc, created_at desc);
create index if not exists products_category_idx on public.products (category);

create or replace function public.set_product_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_product_updated_at();

create or replace function public.is_shegcomtech_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_shegcomtech_admin() from public;
grant execute on function public.is_shegcomtech_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;
drop policy if exists "shegcomtech admin sees own allowlist row" on public.admin_users;
create policy "shegcomtech admin sees own allowlist row"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

drop policy if exists "shegcomtech public reads published products" on public.products;
create policy "shegcomtech public reads published products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "shegcomtech admins read all products" on public.products;
create policy "shegcomtech admins read all products"
  on public.products for select
  to authenticated
  using ((select public.is_shegcomtech_admin()));

drop policy if exists "shegcomtech admins insert products" on public.products;
create policy "shegcomtech admins insert products"
  on public.products for insert
  to authenticated
  with check ((select public.is_shegcomtech_admin()));

drop policy if exists "shegcomtech admins update products" on public.products;
create policy "shegcomtech admins update products"
  on public.products for update
  to authenticated
  using ((select public.is_shegcomtech_admin()))
  with check ((select public.is_shegcomtech_admin()));

drop policy if exists "shegcomtech admins delete products" on public.products;
create policy "shegcomtech admins delete products"
  on public.products for delete
  to authenticated
  using ((select public.is_shegcomtech_admin()));

-- Product photos are intended for public storefront display. Storage reads are
-- public, while every write operation still requires an allowlisted admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shegcomtech admins upload product images" on storage.objects;
create policy "shegcomtech admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_shegcomtech_admin()));

drop policy if exists "shegcomtech admins update product images" on storage.objects;
create policy "shegcomtech admins update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_shegcomtech_admin()))
  with check (bucket_id = 'product-images' and (select public.is_shegcomtech_admin()));

drop policy if exists "shegcomtech admins delete product images" on storage.objects;
create policy "shegcomtech admins delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_shegcomtech_admin()));
