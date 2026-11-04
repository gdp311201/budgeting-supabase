-- ============================================================
-- 12_HYBRID_BUDGET.SQL — Add is_selected column + Hybrid Budget Support
-- ============================================================
-- Run AFTER 08_templates.sql through 11_fix_double_emoji.sql
--
-- Apa yang dilakuin:
-- 1. Add column "is_selected" ke accounts table (default true)
--    - User bisa pilih akun mana yang aktif (show di app)
--    - Akun yang nggak dipilih tetap ada di DB, tapi di-hide di UI
-- 2. Update RPC get_setup_data() untuk:
--    - Include is_selected column
--    - Sort accounts by type (cash → bank → ewallet → investment) + name alphabetically
--    - Sort categories by sort_order (preserve original ordering)
-- ============================================================

-- ============================================================
-- 1. Add is_selected column to accounts table
-- ============================================================
alter table public.accounts 
  add column if not exists is_selected boolean not null default true;

-- Update existing accounts to be selected (default state)
update public.accounts set is_selected = true where is_selected is null;

-- ============================================================
-- 2. Update get_setup_data() function
--    - Include is_selected column in accounts
--    - Sort accounts by type then name alphabetically
--    - Sort categories by sort_order
-- ============================================================
create or replace function public.get_setup_data()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result json;
begin
  if v_user_id is null then
    return json_build_object('status', 'error', 'message', 'Not authenticated');
  end if;

  with user_accounts as (
    select id, name, type, opening_balance, sort_order, is_active, is_selected, created_at
    from public.accounts
    where user_id = v_user_id
    order by
      case type
        when 'cash' then 1
        when 'bank' then 2
        when 'ewallet' then 3
        when 'investment' then 4
      end,
      name
  ),
  user_categories as (
    select id, name, type, icon, sort_order, is_active
    from public.categories
    where user_id = v_user_id
    order by sort_order, name
  ),
  user_subcats as (
    select id, category_id, name, default_amount, sort_order, is_active
    from public.subcategories
    where user_id = v_user_id
    order by sort_order, name
  ),
  user_budgets as (
    select subcategory_id, month, year, amount
    from public.budgets
    where user_id = v_user_id
  )
  select json_build_object(
    'status', 'success',
    'accounts', coalesce((select json_agg(row_to_json(a)) from user_accounts a), '[]'::json),
    'categories', coalesce((select json_agg(row_to_json(c)) from user_categories c), '[]'::json),
    'subcategories', coalesce((select json_agg(row_to_json(s)) from user_subcats s), '[]'::json),
    'budgets', coalesce((select json_agg(row_to_json(b)) from user_budgets b), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- 3. Verify
-- ============================================================
select 
  'accounts with is_selected' as check_name,
  count(*) filter (where is_selected = true) as selected_count,
  count(*) filter (where is_selected = false) as unselected_count,
  count(*) as total
from public.accounts;
