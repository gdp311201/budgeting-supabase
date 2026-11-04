-- ============================================================
-- 03_FUNCTIONS.SQL — RPC Functions (PostgreSQL stored procedures)
-- ============================================================
-- Run AFTER 01_schema.sql and 02_policies.sql
--
-- These functions replicate the logic that was in your Google Sheet
-- DB tab — they aggregate transactions into dashboard/mutasi/receipt data.
--
-- Frontend calls them via supabase.rpc('function_name', { params })
-- Returns JSON that matches the format your old Apps Script returned,
-- so frontend code changes are minimal.
-- ============================================================

-- ============================================================
-- 1. GET_MUTASI_BANK(p_account_id, p_month, p_year)
--    Replicates: 03_ConfigurasiMutasiBankUI.gs getMutasiBankData
-- ============================================================
create or replace function public.get_mutasi_bank(
  p_account_id uuid,
  p_month int,
  p_year int
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_opening_balance numeric;
  v_saldo_awal numeric;
  v_saldo_akhir numeric;
  v_result json;
begin
  if v_user_id is null then
    return json_build_object('status', 'error', 'message', 'Not authenticated');
  end if;

  -- Get opening balance
  select opening_balance into v_opening_balance
  from public.accounts
  where id = p_account_id and user_id = v_user_id;

  if not found then
    return json_build_object('status', 'error', 'message', 'Account not found');
  end if;

  -- Saldo awal = opening_balance + sum semua transaksi SEBELUM bulan target
  select coalesce(sum(
    case
      when type = 'income' then amount
      when type = 'expense' then -amount
      when type = 'transfer_in' then amount
      when type = 'transfer_out' then -amount
      when type = 'investment' then -amount
      else 0
    end
  ), 0) + v_opening_balance
  into v_saldo_awal
  from public.transactions
  where account_id = p_account_id
    and user_id = v_user_id
    and transaction_date < make_date(p_year, p_month, 1);

  -- Build transactions list + summary for the month
  with period_tx as (
    select
      t.id,
      t.transaction_date,
      c.name as kategori,
      c.type as kategori_type,
      coalesce(s.name, '') as subkategori,
      t.amount,
      t.type,
      case when t.type = 'income' then t.amount else null end as income,
      case when t.type = 'expense' then t.amount else null end as expense,
      case when t.type = 'transfer_in' then t.amount else null end as mutasi_in,
      case when t.type = 'transfer_out' then t.amount else null end as mutasi_out
    from public.transactions t
    join public.categories c on t.category_id = c.id
    left join public.subcategories s on t.subcategory_id = s.id
    where t.account_id = p_account_id
      and t.user_id = v_user_id
      and extract(month from t.transaction_date) = p_month
      and extract(year from t.transaction_date) = p_year
    order by t.transaction_date asc
  ),
  summary as (
    select
      coalesce(sum(income), 0) as total_income,
      coalesce(sum(expense), 0) as total_expense,
      coalesce(sum(mutasi_in), 0) as total_mutasi_in,
      coalesce(sum(mutasi_out), 0) as total_mutasi_out
    from period_tx
  )
  select json_build_object(
    'status', 'success',
    'saldoAwal', v_saldo_awal,
    'saldoAkhir', v_saldo_awal + coalesce(
      (select total_income - total_expense + total_mutasi_in - total_mutasi_out from summary), 0
    ),
    'summary', (
      select json_build_object(
        'totalIncome', total_income,
        'totalExpense', total_expense,
        'totalMutasiIn', total_mutasi_in,
        'totalMutasiOut', total_mutasi_out
      ) from summary
    ),
    'transactions', coalesce((select json_agg(row_to_json(t)) from (
      select
        to_char(transaction_date, 'YYYY-MM-DD"T"HH24:MI:SS') as tgl_iso,
        to_char(transaction_date, 'DD Mon YYYY') as tgl,
        kategori,
        subkategori,
        amount,
        type,
        income,
        expense,
        mutasi_in,
        mutasi_out,
        id
      from period_tx
    ) t), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- 2. GET_DASHBOARD(p_month, p_year)
--    Replicates: 05_DashboardUI.gs getDashboardData
-- ============================================================
create or replace function public.get_dashboard(
  p_month int,
  p_year int
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period_end date := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
  v_result json;
begin
  if v_user_id is null then
    return json_build_object('status', 'error', 'message', 'Not authenticated');
  end if;

  with
  -- Total Kas & Bank (saldo akhir bulan ini, semua akun bank/ewallet/cash)
  bank_balance as (
    select
      a.id, a.name,
      coalesce(sum(
        case
          when t.type = 'income' then t.amount
          when t.type = 'expense' then -t.amount
          when t.type = 'transfer_in' then t.amount
          when t.type = 'transfer_out' then -t.amount
          else 0
        end
      ), 0) + a.opening_balance as saldo
    from public.accounts a
    left join public.transactions t on t.account_id = a.id
      and t.user_id = v_user_id
      and t.transaction_date <= v_period_end
    where a.user_id = v_user_id
      and a.type in ('bank', 'ewallet', 'cash')
      and a.is_active = true
    group by a.id, a.name, a.opening_balance
  ),
  bank_total as (
    select coalesce(sum(saldo), 0) as total from bank_balance
  ),

  -- Total Investasi (saldo akhir bulan ini)
  inv_balance as (
    select
      a.id, a.name,
      coalesce(sum(t.amount), 0) + a.opening_balance as saldo
    from public.accounts a
    left join public.transactions t on t.account_id = a.id
      and t.user_id = v_user_id
      and t.transaction_date <= v_period_end
    where a.user_id = v_user_id
      and a.type = 'investment'
      and a.is_active = true
    group by a.id, a.name, a.opening_balance
  ),
  inv_total as (
    select coalesce(sum(saldo), 0) as total from inv_balance
  ),

  -- Cash flow bulan ini (per kategori type)
  cashflow as (
    select
      c.type,
      coalesce(sum(t.amount), 0) as nominal
    from public.transactions t
    join public.categories c on t.category_id = c.id
    where t.user_id = v_user_id
      and extract(month from t.transaction_date) = p_month
      and extract(year from t.transaction_date) = p_year
    group by c.type
  ),

  -- Cash flow detail per kategori (untuk breakdown rincian)
  cashflow_detail as (
    select
      c.name as kategori,
      c.type as kategori_type,
      coalesce(sum(t.amount), 0) as nominal
    from public.transactions t
    join public.categories c on t.category_id = c.id
    where t.user_id = v_user_id
      and extract(month from t.transaction_date) = p_month
      and extract(year from t.transaction_date) = p_year
      and c.type = 'expense'
    group by c.name, c.type
  ),

  -- Top 5 expenses by subkategori
  top5 as (
    select
      coalesce(s.name, 'Unknown') as sub_kategori,
      sum(t.amount) as nominal
    from public.transactions t
    join public.subcategories s on t.subcategory_id = s.id
    join public.categories c on t.category_id = c.id
    where t.user_id = v_user_id
      and c.type = 'expense'
      and extract(month from t.transaction_date) = p_month
      and extract(year from t.transaction_date) = p_year
    group by s.name
    order by nominal desc
    limit 5
  ),

  -- Random daily quote
  quote as (
    select text from public.daily_quotes
    where is_active = true
    order by random()
    limit 1
  )

  select json_build_object(
    'status', 'success',
    'bulan', p_month,
    'tahun', p_year,
    'totalAset', (select total from bank_total) + (select total from inv_total),
    'bank', json_build_object(
      'total', (select total from bank_total),
      'items', coalesce((select json_agg(row_to_json(b)) from (
        select name, saldo from bank_balance order by name
      ) b), '[]'::json)
    ),
    'investment', json_build_object(
      'total', (select total from inv_total),
      'items', coalesce((select json_agg(row_to_json(i)) from (
        select name, saldo from inv_balance order by name
      ) i), '[]'::json)
    ),
    'cashflow', json_build_object(
      'pemasukan', coalesce((select nominal from cashflow where type = 'income'), 0),
      'hutang', coalesce((select nominal from cashflow where type = 'debt'), 0),
      'investasiBulan', coalesce((select nominal from cashflow where type = 'investment'), 0),
      'totalBiaya', coalesce((select sum(nominal) from cashflow where type = 'expense'), 0)
    ),
    'biayaDetail', coalesce((select json_agg(row_to_json(d)) from (
      select kategori as nama, nominal from cashflow_detail order by nominal desc
    ) d), '[]'::json),
    'top5Expenses', coalesce((select json_agg(row_to_json(t)) from (
      select sub_kategori as "subKategori", nominal from top5
    ) t), '[]'::json),
    'quote', coalesce((select text from quote), 'Stay financially healthy!')
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- 3. GET_ERECEIPT(p_month, p_year)
--    Replicates: 04_E_Receipt.gs getEReceiptData
-- ============================================================
create or replace function public.get_ereceipt(
  p_month int,
  p_year int
)
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

  with period_tx as (
    select
      c.name as kategori,
      c.type as kategori_type,
      coalesce(s.name, '') as subkategori,
      t.amount,
      t.type
    from public.transactions t
    join public.categories c on t.category_id = c.id
    left join public.subcategories s on t.subcategory_id = s.id
    where t.user_id = v_user_id
      and extract(month from t.transaction_date) = p_month
      and extract(year from t.transaction_date) = p_year
  ),
  totals as (
    select
      coalesce(sum(case when type = 'income' then amount end), 0) as total_income,
      coalesce(sum(case when type = 'expense' then amount end), 0) as total_outcome,
      coalesce(sum(case when type = 'investment' then amount end), 0) as total_saving
    from period_tx
  ),
  bank_total as (
    select coalesce(sum(
      case t.type
        when 'income' then t.amount
        when 'expense' then -t.amount
        when 'transfer_in' then t.amount
        when 'transfer_out' then -t.amount
        else 0
      end
    ), 0) + a.opening_balance as saldo
    from public.accounts a
    left join public.transactions t on t.account_id = a.id
      and t.user_id = v_user_id
      and t.transaction_date <= (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date
    where a.user_id = v_user_id
      and a.type in ('bank', 'ewallet', 'cash')
      and a.is_active = true
  ),
  inv_total as (
    select coalesce(sum(t.amount), 0) + a.opening_balance as saldo
    from public.accounts a
    left join public.transactions t on t.account_id = a.id
      and t.user_id = v_user_id
      and t.transaction_date <= (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date
    where a.user_id = v_user_id
      and a.type = 'investment'
      and a.is_active = true
  )
  select json_build_object(
    'status', 'success',
    'bulan', p_month,
    'tahun', p_year,
    'summary', json_build_object(
      'saldoBank', coalesce((select saldo from bank_total), 0),
      'totalAset', coalesce((select saldo from bank_total), 0) + coalesce((select saldo from inv_total), 0),
      'totalIncome', (select total_income from totals),
      'totalOutcome', (select total_outcome from totals),
      'totalSaving', (select total_saving from totals)
    ),
    'details', json_build_object(
      'income', coalesce((select json_agg(row_to_json(t)) from (
        select kategori, subkategori, amount as nominal
        from period_tx where type = 'income' order by amount desc
      ) t), '[]'::json),
      'investment', coalesce((select json_agg(row_to_json(t)) from (
        select kategori, subkategori, amount as nominal
        from period_tx where type = 'investment' order by amount desc
      ) t), '[]'::json),
      'outcome', coalesce((select json_agg(row_to_json(t)) from (
        select kategori, subkategori, amount as nominal
        from period_tx where type = 'expense' order by amount desc
      ) t), '[]'::json)
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- 4. GET_SEARCH(p_month, p_year, p_keyword, p_sort)
--    Replicates: 06_SearchUI.gs getSearchData
-- ============================================================
create or replace function public.get_search(
  p_month int,
  p_year int,
  p_keyword text,
  p_sort text
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result json;
  v_kw text := lower(trim(coalesce(p_keyword, '')));
begin
  if v_user_id is null then
    return json_build_object('status', 'error', 'message', 'Not authenticated');
  end if;

  with filtered as (
    select
      t.id,
      t.transaction_date,
      c.name as kategori,
      coalesce(s.name, '') as subkategori,
      a.name as akun,
      t.amount as nominal,
      t.type,
      extract(month from t.transaction_date)::int as bulan_num,
      extract(year from t.transaction_date)::int as tahun_num
    from public.transactions t
    join public.categories c on t.category_id = c.id
    left join public.subcategories s on t.subcategory_id = s.id
    left join public.accounts a on t.account_id = a.id
    where t.user_id = v_user_id
      and (p_month is null or p_month = 0 or extract(month from t.transaction_date)::int = p_month)
      and (p_year is null or p_year = 0 or extract(year from t.transaction_date)::int = p_year)
      and (
        v_kw = '' or
        lower(c.name) like '%' || v_kw || '%' or
        lower(s.name) like '%' || v_kw || '%' or
        lower(a.name) like '%' || v_kw || '%' or
        to_char(t.amount, 'FM999,999,999') like '%' || v_kw || '%' or
        to_char(t.transaction_date, 'DD Mon YYYY') like '%' || v_kw || '%'
      )
  ),
  sorted as (
    select * from filtered
    order by
      case when coalesce(p_sort, 'DESC') = 'DESC' then transaction_date end desc,
      case when coalesce(p_sort, 'DESC') = 'ASC' then transaction_date end asc
  ),
  totals as (
    select
      count(*) as total_count,
      coalesce(sum(nominal), 0) as total_nominal
    from filtered
  )
  select json_build_object(
    'status', 'success',
    'totalCount', (select total_count from totals),
    'totalNominal', (select total_nominal from totals),
    'transactions', coalesce((select json_agg(row_to_json(t)) from (
      select
        id,
        to_char(transaction_date, 'DD Mon YYYY') as tgl,
        to_char(transaction_date, 'YYYY-MM-DD') as tgl_iso,
        kategori,
        subkategori,
        akun,
        nominal,
        type
      from sorted
    ) t), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- 5. GET_SETUP_DATA()
--    Replicates: 07_SetUpUI.gs getSetupData
--    Returns all master data for setup panel (accounts, categories, subcats, budgets)
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
    select id, name, type, opening_balance, sort_order, is_active
    from public.accounts
    where user_id = v_user_id
    order by sort_order, name
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
-- GRANT EXECUTE on all RPC functions to authenticated users
-- ============================================================
grant execute on function public.get_mutasi_bank(uuid, int, int) to authenticated;
grant execute on function public.get_dashboard(int, int) to authenticated;
grant execute on function public.get_ereceipt(int, int) to authenticated;
grant execute on function public.get_search(int, int, text, text) to authenticated;
grant execute on function public.get_setup_data() to authenticated;
