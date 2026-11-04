-- ============================================================
-- 01_SCHEMA.SQL — Budgeting Master Sync Database Schema
-- ============================================================
-- Run this FIRST in Supabase SQL Editor (Dashboard → SQL → New Query)
-- Then run 02_policies.sql, 03_functions.sql, 04_seed.sql in order
-- ============================================================

-- ============================================================
-- 1. PROFILES (extends auth.users — stores customization per user)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  app_name text not null default 'My Budgeting',
  icon_name text not null default 'elephant',
  icon_url text,
  wallpaper_url text,
  palette jsonb not null default '{"primary":"#ec4899","accent":"#f43f5e","gradient":["#8a96a8","#ba9eb1","#e3b9ca"]}'::jsonb,
  glass_settings jsonb not null default '{"blur_wallpaper":0,"dim_wallpaper":0.75,"blur_page":3,"blur_nav":3,"blur_mini":12,"blur_card":1.8,"blur_input":8}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. ACCOUNTS (akun bank / e-wallet / cash / investment)
--    Maps to: SET_UP sheet "Akun Bank" section
-- ============================================================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank','ewallet','cash','investment')),
  opening_balance numeric not null default 0,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- ============================================================
-- 3. CATEGORIES (kategori utama: PEMASUKAN, KEBUTUHAN POKOK, dst)
--    Maps to: SET_UP sheet kategori list + DB sheet dropdown
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense','transfer','investment','debt','other')),
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique(user_id, name)
);

-- ============================================================
-- 4. SUBCATEGORIES (sub-kategori: Makanan, Listrik, dst)
--    Maps to: SET_UP sheet sub-kategori per kategori
-- ============================================================
create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  default_amount numeric,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique(user_id, category_id, name)
);

-- ============================================================
-- 5. BUDGETS (budget bulanan per subkategori)
--    Maps to: SET_UP sheet nominal budget per subkategori
-- ============================================================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subcategory_id uuid not null references public.subcategories(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  amount numeric not null default 0,
  unique(user_id, subcategory_id, month, year)
);

-- ============================================================
-- 6. TRANSACTIONS (inti aplikasi — semua catatan transaksi)
--    Maps to: TRANSAKSI sheet (kolom A-E)
--    NOTE: Kolom helper BULAN/TAHUN (F-G di Sheet) DIHAPUS
--          karena bisa di-derive dari transaction_date saat query
-- ============================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_date date not null,
  category_id uuid not null references public.categories(id),
  subcategory_id uuid references public.subcategories(id),
  account_id uuid not null references public.accounts(id),
  to_account_id uuid references public.accounts(id),
  amount numeric not null,
  type text not null check (type in ('income','expense','transfer_in','transfer_out','investment')),
  note text,
  created_at timestamptz not null default now()
);

-- Indexes buat query cepat
create index if not exists idx_tx_user_date on public.transactions(user_id, transaction_date);
create index if not exists idx_tx_user_month_year on public.transactions(user_id, extract(month from transaction_date), extract(year from transaction_date));
create index if not exists idx_tx_account on public.transactions(user_id, account_id);
create index if not exists idx_tx_category on public.transactions(user_id, category_id);

-- ============================================================
-- 7. DAILY_QUOTES (master data — quotes harian aesthetic)
--    Maps to: DB sheet "Daily Quotes" section
-- ============================================================
create table if not exists public.daily_quotes (
  id serial primary key,
  text text not null,
  is_active boolean not null default true
);

-- ============================================================
-- 8. DASHBOARD_EMOJIS (master data — emoji indikator dashboard)
--    Maps to: DB sheet "Dropdown Emot Icon" section
-- ============================================================
create table if not exists public.dashboard_emojis (
  id serial primary key,
  category text not null,  -- 'safety', 'warning', 'success', 'celebrate'
  emoji text not null,
  message text
);

-- ============================================================
-- 9. AUTO-CREATE PROFILE WHEN USER SIGNS UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
