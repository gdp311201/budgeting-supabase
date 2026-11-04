-- ============================================================
-- 02_POLICIES.SQL — Row Level Security (RLS)
-- ============================================================
-- Run AFTER 01_schema.sql
--
-- RLS = user cuma bisa akses data miliknya sendiri
-- Tanpa RLS, lupa WHERE user_id = ... → bocor data
-- Dengan RLS, query otomatis di-filter oleh Supabase
-- ============================================================

-- Enable RLS untuk semua tabel yang punya user_id
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;

-- ============================================================
-- PROFILES — user cuma bisa CRUD profile miliknya
-- ============================================================
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- ACCOUNTS
-- ============================================================
drop policy if exists "Accounts: select own" on public.accounts;
create policy "Accounts: select own"
  on public.accounts for select
  using (auth.uid() = user_id);

drop policy if exists "Accounts: insert own" on public.accounts;
create policy "Accounts: insert own"
  on public.accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Accounts: update own" on public.accounts;
create policy "Accounts: update own"
  on public.accounts for update
  using (auth.uid() = user_id);

drop policy if exists "Accounts: delete own" on public.accounts;
create policy "Accounts: delete own"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
drop policy if exists "Categories: select own" on public.categories;
create policy "Categories: select own"
  on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "Categories: insert own" on public.categories;
create policy "Categories: insert own"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Categories: update own" on public.categories;
create policy "Categories: update own"
  on public.categories for update
  using (auth.uid() = user_id);

drop policy if exists "Categories: delete own" on public.categories;
create policy "Categories: delete own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- SUBCATEGORIES
-- ============================================================
drop policy if exists "Subcategories: select own" on public.subcategories;
create policy "Subcategories: select own"
  on public.subcategories for select
  using (auth.uid() = user_id);

drop policy if exists "Subcategories: insert own" on public.subcategories;
create policy "Subcategories: insert own"
  on public.subcategories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Subcategories: update own" on public.subcategories;
create policy "Subcategories: update own"
  on public.subcategories for update
  using (auth.uid() = user_id);

drop policy if exists "Subcategories: delete own" on public.subcategories;
create policy "Subcategories: delete own"
  on public.subcategories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- BUDGETS
-- ============================================================
drop policy if exists "Budgets: select own" on public.budgets;
create policy "Budgets: select own"
  on public.budgets for select
  using (auth.uid() = user_id);

drop policy if exists "Budgets: insert own" on public.budgets;
create policy "Budgets: insert own"
  on public.budgets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Budgets: update own" on public.budgets;
create policy "Budgets: update own"
  on public.budgets for update
  using (auth.uid() = user_id);

drop policy if exists "Budgets: delete own" on public.budgets;
create policy "Budgets: delete own"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
drop policy if exists "Transactions: select own" on public.transactions;
create policy "Transactions: select own"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Transactions: insert own" on public.transactions;
create policy "Transactions: insert own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Transactions: update own" on public.transactions;
create policy "Transactions: update own"
  on public.transactions for update
  using (auth.uid() = user_id);

drop policy if exists "Transactions: delete own" on public.transactions;
create policy "Transactions: delete own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- MASTER DATA (daily_quotes, dashboard_emojis) — readable by all auth users
-- ============================================================
alter table public.daily_quotes enable row level security;
alter table public.dashboard_emojis enable row level security;

drop policy if exists "Quotes readable by authed" on public.daily_quotes;
create policy "Quotes readable by authed"
  on public.daily_quotes for select
  to authenticated
  using (is_active = true);

drop policy if exists "Emojis readable by authed" on public.dashboard_emojis;
create policy "Emojis readable by authed"
  on public.dashboard_emojis for select
  to authenticated
  using (true);
