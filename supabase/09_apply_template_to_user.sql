-- ============================================================
-- 09_APPLY_TEMPLATE_TO_USER.SQL — Apply Template to Existing Users
-- ============================================================
-- Run AFTER 08_templates.sql
--
-- Konsep:
--   Function apply_template_to_user(p_user_id) buat apply
--   template ke user yang SUDAH ada (sebelum 08_templates.sql di-run)
--
--   Cocok untuk akun lu sendiri (growspheredigpro@gmail.com) yang
--   signup sebelum template system ada.
--
-- Cara pakai:
--   1. Buka Supabase SQL Editor
--   2. Paste SQL ini, klik Run (buat bikin function)
--   3. Lalu panggil function dengan SQL:
--      select apply_template_to_user(
--        (select id from auth.users where email = 'growspheredigpro@gmail.com')
--      );
-- ============================================================

-- ============================================================
-- 1. Bikin Function apply_template_to_user
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
  -- 1. Get user email + verify exists
  select email into v_user_email from auth.users where id = p_user_id;
  
  if v_user_email is null then
    return json_build_object(
      'status', 'error',
      'message', 'User not found with ID: ' || p_user_id::text
    );
  end if;
  
  -- 2. Get counts BEFORE
  select count(*) into v_count_before_cat from public.categories where user_id = p_user_id;
  select count(*) into v_count_before_sub from public.subcategories where user_id = p_user_id;
  select count(*) into v_count_before_acc from public.accounts where user_id = p_user_id;
  
  -- 3. Apply template categories
  insert into public.categories (user_id, name, type, icon, sort_order, is_active)
  select
    p_user_id,
    tc.name,
    tc.type,
    tc.icon,
    tc.sort_order,
    true
  from public.template_categories tc
  where tc.is_active = true
  on conflict (user_id, name) do nothing;
  
  select count(*) into v_count_categories from public.categories where user_id = p_user_id;
  
  -- 4. Apply template subcategories
  insert into public.subcategories (user_id, category_id, name, default_amount, sort_order, is_active)
  select
    p_user_id,
    uc.id,
    ts.name,
    ts.default_amount,
    ts.sort_order,
    true
  from public.template_subcategories ts
  join public.template_categories tc on ts.category_id = tc.id
  join public.categories uc on uc.user_id = p_user_id and uc.name = tc.name
  where ts.is_active = true
  on conflict (user_id, category_id, name) do nothing;
  
  select count(*) into v_count_subcategories from public.subcategories where user_id = p_user_id;
  
  -- 5. Apply popular bank accounts (kalau belum ada)
  insert into public.accounts (user_id, name, type, opening_balance, sort_order)
  select
    p_user_id,
    bo.name,
    bo.type::text,
    0,
    bo.sort_order
  from public.bank_options bo
  where bo.is_popular = true
    and bo.is_active = true
    and bo.type in ('bank', 'ewallet', 'cash')
  order by bo.sort_order
  on conflict (user_id, name) do nothing;
  
  -- 6. Apply investment accounts
  insert into public.accounts (user_id, name, type, opening_balance, sort_order)
  select
    p_user_id,
    ts.name,
    'investment',
    0,
    100 + ts.sort_order
  from public.template_subcategories ts
  where ts.category_id = 'tabungan-invest'
    and ts.is_active = true
  on conflict (user_id, name) do nothing;
  
  select count(*) into v_count_accounts from public.accounts where user_id = p_user_id;
  
  -- 7. Return summary
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

-- Grant execute permission
grant execute on function public.apply_template_to_user(uuid) to authenticated;
grant execute on function public.apply_template_to_user(uuid) to service_role;

-- ============================================================
-- 2. Verify function created
-- ============================================================
select 
  proname as function_name,
  pg_get_function_arguments(oid) as args,
  pg_get_function_result(oid) as return_type
from pg_proc 
where proname = 'apply_template_to_user' 
  and pronamespace = 'public'::regnamespace;
