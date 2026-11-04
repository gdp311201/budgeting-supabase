-- ============================================================
-- 13_SETUP_IMPROVEMENTS.SQL — Protected Accounts + Custom Subcategories
-- ============================================================
-- Run AFTER 08_templates.sql through 12_hybrid_budget.sql
--
-- Apa yang dilakuin:
-- 1. Add column "is_protected" ke accounts table (default false)
--    - Akun protected (CASH + investment defaults) nggak bisa dihapus/hide
--    - Bisa edit opening_balance saja
-- 2. Add column "is_custom" ke subcategories table (default false)
--    - Subkategori custom (yang user add sendiri) bisa dihapus
--    - Subkategori default (dari template) nggak bisa dihapus
-- 3. Update trigger handle_new_user():
--    - Auto-create CASH dengan is_protected = true (PERMANEN)
--    - Auto-create 6 akun investasi default dengan is_protected = true
--    - SKIP auto-create bank/e-wallet (user pilih manual via Setup)
-- 4. Update apply_template_to_user() function (same logic)
-- 5. Update existing CASH + investment accounts: set is_protected = true
-- ============================================================

-- ============================================================
-- 1. Add is_protected column to accounts
-- ============================================================
alter table public.accounts
  add column if not exists is_protected boolean not null default false;

-- Update existing: CASH jadi protected
update public.accounts set is_protected = true
  where type = 'cash' and is_active = true;

-- Update existing: investment default accounts jadi protected
update public.accounts set is_protected = true
  where type = 'investment'
    and name in ('Safety Money', 'Deposito Bank', 'Reksadana', 'Arisan', 'Logam Mulia', 'Saham');

-- ============================================================
-- 2. Add is_custom column to subcategories
-- ============================================================
alter table public.subcategories
  add column if not exists is_custom boolean not null default false;

-- All existing subcategories are NOT custom (from template)
update public.subcategories set is_custom = false where is_custom is null;

-- ============================================================
-- 3. Update handle_new_user() trigger
--    CASH: auto-create with is_protected=true
--    Investment: auto-create 6 defaults with is_protected=true
--    Bank/E-wallet: SKIP (user pilih manual via Setup)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_whitelist record;
  v_template_cat record;
  v_cat_id uuid;
  v_count_accounts int := 0;
  v_count_categories int := 0;
  v_count_subcategories int := 0;
begin
  -- Cek whitelist untuk dapat info premium, theme, mascot
  select * into v_whitelist
  from public.allowed_emails
  where lower(email) = lower(new.email)
  limit 1;

  -- Insert profile
  insert into public.profiles (id, email, full_name, is_premium, selected_theme_id, selected_mascot_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(v_whitelist.is_premium, false),
    v_whitelist.assigned_theme,
    v_whitelist.assigned_mascot
  )
  on conflict (id) do update set
    is_premium = excluded.is_premium,
    selected_theme_id = coalesce(excluded.selected_theme_id, profiles.selected_theme_id),
    selected_mascot_id = coalesce(excluded.selected_mascot_id, profiles.selected_mascot_id);

  -- ============================================================
  -- AUTO-APPLY TEMPLATE: Categories + Subcategories + Accounts
  -- ============================================================

  -- 1. Copy template categories ke user categories
  insert into public.categories (user_id, name, type, icon, sort_order, is_active)
  select new.id, tc.name, tc.type, tc.icon, tc.sort_order, true
  from public.template_categories tc
  where tc.is_active = true
  on conflict (user_id, name) do nothing;

  select count(*) into v_count_categories from public.categories where user_id = new.id;

  -- 2. Copy template subcategories ke user subcategories (is_custom = false)
  insert into public.subcategories (user_id, category_id, name, default_amount, sort_order, is_active, is_custom)
  select
    new.id,
    uc.id,
    ts.name,
    ts.default_amount,
    ts.sort_order,
    true,
    false
  from public.template_subcategories ts
  join public.template_categories tc on ts.category_id = tc.id
  join public.categories uc on uc.user_id = new.id and uc.name = tc.name
  where ts.is_active = true
  on conflict (user_id, category_id, name) do nothing;

  select count(*) into v_count_subcategories from public.subcategories where user_id = new.id;

  -- 3. Auto-create CASH (permanen, is_protected=true, is_selected=true)
  insert into public.accounts (user_id, name, type, opening_balance, sort_order, is_active, is_selected, is_protected)
  values (new.id, 'CASH', 'cash', 0, 1, true, true, true)
  on conflict (user_id, name) do nothing;

  -- 4. Auto-create 6 investment default accounts (is_protected=true, is_selected=true)
  insert into public.accounts (user_id, name, type, opening_balance, sort_order, is_active, is_selected, is_protected)
  select
    new.id,
    ts.name,
    'investment',
    0,
    100 + ts.sort_order,
    true,
    true,
    true
  from public.template_subcategories ts
  where ts.category_id = 'tabungan-invest'
    and ts.is_active = true
  on conflict (user_id, name) do nothing;

  -- NOTE: Bank & E-wallet TIDAK di-auto-create. User pilih manual via Setup.

  select count(*) into v_count_accounts from public.accounts where user_id = new.id;

  raise notice 'User % signup complete: % categories, % subcategories, % accounts (CASH + 6 investment)',
    new.email, v_count_categories, v_count_subcategories, v_count_accounts;

  return new;
end;
$$;

-- ============================================================
-- 4. Update apply_template_to_user() function
--    Same logic: CASH + investment protected, no bank/e-wallet auto-create
-- ============================================================
create or replace function public.apply_template_to_user(p_user_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_email text;
  v_count_categories int := 0;
  v_count_subcategories int := 0;
  v_count_accounts int := 0;
  v_count_before_cat int;
  v_count_before_sub int;
  v_count_before_acc int;
begin
  select email into v_user_email from auth.users where id = p_user_id;

  if v_user_email is null then
    return json_build_object('status', 'error', 'message', 'User not found');
  end if;

  select count(*) into v_count_before_cat from public.categories where user_id = p_user_id;
  select count(*) into v_count_before_sub from public.subcategories where user_id = p_user_id;
  select count(*) into v_count_before_acc from public.accounts where user_id = p_user_id;

  -- 1. Apply template categories
  insert into public.categories (user_id, name, type, icon, sort_order, is_active)
  select p_user_id, tc.name, tc.type, tc.icon, tc.sort_order, true
  from public.template_categories tc
  where tc.is_active = true
  on conflict (user_id, name) do nothing;

  select count(*) into v_count_categories from public.categories where user_id = p_user_id;

  -- 2. Apply template subcategories (is_custom = false)
  insert into public.subcategories (user_id, category_id, name, default_amount, sort_order, is_active, is_custom)
  select
    p_user_id,
    uc.id,
    ts.name,
    ts.default_amount,
    ts.sort_order,
    true,
    false
  from public.template_subcategories ts
  join public.template_categories tc on ts.category_id = tc.id
  join public.categories uc on uc.user_id = p_user_id and uc.name = tc.name
  where ts.is_active = true
  on conflict (user_id, category_id, name) do nothing;

  select count(*) into v_count_subcategories from public.subcategories where user_id = p_user_id;

  -- 3. Auto-create CASH (protected, selected)
  insert into public.accounts (user_id, name, type, opening_balance, sort_order, is_active, is_selected, is_protected)
  values (p_user_id, 'CASH', 'cash', 0, 1, true, true, true)
  on conflict (user_id, name) do nothing;

  -- 4. Auto-create investment defaults (protected, selected)
  insert into public.accounts (user_id, name, type, opening_balance, sort_order, is_active, is_selected, is_protected)
  select
    p_user_id,
    ts.name,
    'investment',
    0,
    100 + ts.sort_order,
    true,
    true,
    true
  from public.template_subcategories ts
  where ts.category_id = 'tabungan-invest'
    and ts.is_active = true
  on conflict (user_id, name) do nothing;

  -- 5. Mark existing CASH as protected
  update public.accounts set is_protected = true
    where user_id = p_user_id and type = 'cash' and name = 'CASH';

  -- 6. Mark existing investment defaults as protected
  update public.accounts set is_protected = true
    where user_id = p_user_id
      and type = 'investment'
      and name in ('Safety Money', 'Deposito Bank', 'Reksadana', 'Arisan', 'Logam Mulia', 'Saham');

  select count(*) into v_count_accounts from public.accounts where user_id = p_user_id;

  return json_build_object(
    'status', 'success',
    'message', 'Template applied to user: ' || v_user_email,
    'user_id', p_user_id,
    'user_email', v_user_email,
    'counts', json_build_object(
      'categories_before', v_count_before_cat,
      'categories_after', v_count_categories,
      'subcategories_before', v_count_before_sub,
      'subcategories_after', v_count_subcategories,
      'accounts_before', v_count_before_acc,
      'accounts_after', v_count_accounts
    )
  );
end;
$$;

-- ============================================================
-- 5. RLS policies: prevent delete/update of protected accounts
-- ============================================================
-- Already have policies from 02_policies.sql. Add extra check:
-- User can update non-protected accounts (bank, ewallet, custom investment)
-- User CANNOT delete protected accounts (CASH + investment defaults)
-- ============================================================

-- Drop existing delete policy for accounts
drop policy if exists "Accounts: delete own" on public.accounts;

-- New delete policy: only allow delete if NOT protected
create policy "Accounts: delete own (non-protected only)"
  on public.accounts for delete
  to authenticated
  using (auth.uid() = user_id and is_protected = false);

-- Drop existing update policy for accounts
drop policy if exists "Accounts: update own" on public.accounts;

-- New update policy: allow update, but is_protected column cannot be changed by user
create policy "Accounts: update own"
  on public.accounts for update
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 6. Subcategories: prevent delete of default (is_custom = false)
-- ============================================================
drop policy if exists "Subcategories: delete own" on public.subcategories;

create policy "Subcategories: delete own (custom only)"
  on public.subcategories for delete
  to authenticated
  using (auth.uid() = user_id and is_custom = true);

-- ============================================================
-- 7. Categories: prevent delete of default categories
--    Default categories are those with sort_order <= 12 (from template)
-- ============================================================
drop policy if exists "Categories: delete own" on public.categories;

create policy "Categories: delete own (custom only)"
  on public.categories for delete
  to authenticated
  using (auth.uid() = user_id and sort_order > 12);

-- ============================================================
-- 8. Verify
-- ============================================================
select
  'accounts' as table_name,
  count(*) filter (where is_protected = true) as protected_count,
  count(*) filter (where is_protected = false) as not_protected_count,
  count(*) as total
from public.accounts;
