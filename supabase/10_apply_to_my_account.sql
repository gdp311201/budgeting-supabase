-- ============================================================
-- RUN_THIS: Apply Template to growspharedigpro@gmail.com
-- ============================================================
-- Run AFTER 08_templates.sql AND 09_apply_template_to_user.sql
--
-- SQL ini akan:
--   1. Call function apply_template_to_user buat akun lu
--   2. Apply 12 categories + ~101 subcategories + ~11 bank accounts
--   3. Return summary JSON biar lu bisa verifikasi
-- ============================================================

-- Step 1: Apply template ke akun lu
select apply_template_to_user(
  (select id from auth.users where email = 'growspheredigpro@gmail.com')
) as result;

-- Step 2: Verifikasi hasil (optional, buat double-check)
-- Uncomment kalau mau lihat detail counts
/*
select 
  'categories' as table_name, count(*) as total 
  from public.categories 
  where user_id = (select id from auth.users where email = 'growspharedigpro@gmail.com')
union all
select 
  'subcategories', count(*) 
  from public.subcategories 
  where user_id = (select id from auth.users where email = 'growspharedigpro@gmail.com')
union all
select 
  'accounts', count(*) 
  from public.accounts 
  where user_id = (select id from auth.users where email = 'growspharedigpro@gmail.com');
*/
