-- ============================================================
-- 14_FIX_RPC_FUNCTIONS.SQL — Fix 3 RPC functions
-- ============================================================
-- Run AFTER 13_setup_improvements.sql
--
-- Fixes:
-- 1. get_mutasi_bank(): return display_label (PINDAH DANA → "→ MANDIRI")
-- 2. get_ereceipt(): fix GROUP BY error (column must appear in GROUP BY)
-- 3. get_search(): return to_account_name field
-- ============================================================

-- ============================================================
-- 1. FIX: get_mutasi_bank()
--    Add display_label field:
--    - PINDAH DANA: "→ MANDIRI" (nama akun tujuan)
--    - Other: subkategori as-is
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
      when t.type = 'income' then t.amount
      when t.type = 'expense' then -t.amount
      when t.type = 'transfer_in' then t.amount
      when t.type = 'transfer_out' then -t.amount
      when t.type = 'investment' then -t.amount
      else 0
    end
  ), 0) + v_opening_balance
  into v_saldo_awal
  from public.transactions t
  where t.account_id = p_account_id
    and t.user_id = v_user_id
    and t.transaction_date < make_date(p_year, p_month, 1);

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
      ta.name as to_account_name,
      case
        when t.type = 'transfer_out' and ta.name is not null then '→ ' || ta.name
        when t.type = 'transfer_in' then '← Transfer In'
        else coalesce(s.name, '')
      end as display_label,
      case when t.type = 'income' then t.amount else null end as income,
      case when t.type = 'expense' then t.amount else null end as expense,
      case when t.type = 'transfer_in' then t.amount else null end as mutasi_in,
      case when t.type = 'transfer_out' then t.amount else null end as mutasi_out
    from public.transactions t
    join public.categories c on t.category_id = c.id
    left join public.subcategories s on t.subcategory_id = s.id
    left join public.accounts ta on t.to_account_id = ta.id
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
        id,
        to_char(transaction_date, 'YYYY-MM-DD"T"HH24:MI:SS') as tgl_iso,
        to_char(transaction_date, 'DD Mon YYYY') as tgl,
        kategori,
        subkategori,
        display_label,
        amount,
        type,
        to_account_name,
        income,
        expense,
        mutasi_in,
        mutasi_out
      from period_tx
    ) t), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- 2. FIX: get_ereceipt() — fix GROUP BY error
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
  v_period_end date := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
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
  -- FIX: bank_total dengan GROUP BY yang bener
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
      and t.transaction_date <= v_period_end
    where a.user_id = v_user_id
      and a.type in ('bank', 'ewallet', 'cash')
      and a.is_active = true
      and a.is_selected = true
    group by a.id, a.opening_balance
  ),
  inv_total as (
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
      and t.transaction_date <= v_period_end
    where a.user_id = v_user_id
      and a.type = 'investment'
      and a.is_active = true
      and a.is_selected = true
    group by a.id, a.opening_balance
  )
  select json_build_object(
    'status', 'success',
    'bulan', p_month,
    'tahun', p_year,
    'summary', json_build_object(
      'saldoBank', coalesce((select sum(saldo) from bank_total), 0),
      'totalAset', coalesce((select sum(saldo) from bank_total), 0) + coalesce((select sum(saldo) from inv_total), 0),
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
-- 3. FIX: get_search() — return to_account_name field
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
      c.type as kategori_type,
      coalesce(s.name, '') as subkategori,
      a.name as akun,
      ta.name as to_account_name,
      case
        when t.type = 'transfer_out' and ta.name is not null then '→ ' || ta.name
        when t.type = 'transfer_in' then '← Transfer In'
        else coalesce(s.name, '')
      end as display_label,
      t.amount as nominal,
      t.type,
      extract(month from t.transaction_date)::int as bulan_num,
      extract(year from t.transaction_date)::int as tahun_num
    from public.transactions t
    join public.categories c on t.category_id = c.id
    left join public.subcategories s on t.subcategory_id = s.id
    left join public.accounts a on t.account_id = a.id
    left join public.accounts ta on t.to_account_id = ta.id
    where t.user_id = v_user_id
      and (p_month is null or p_month = 0 or extract(month from t.transaction_date)::int = p_month)
      and (p_year is null or p_year = 0 or extract(year from t.transaction_date)::int = p_year)
      and (
        v_kw = '' or
        lower(c.name) like '%' || v_kw || '%' or
        lower(s.name) like '%' || v_kw || '%' or
        lower(a.name) like '%' || v_kw || '%' or
        to_char(t.amount, 'FM999,999,999') like '%' || v_kw || '%' or
        to_char(t.transaction_date, 'DD Mon YYYY') like '%' || v_kw || '%' or
        (ta.name is not null and lower(ta.name) like '%' || v_kw || '%')
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
        display_label,
        akun,
        to_account_name,
        nominal,
        type
      from sorted
    ) t), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- 4. Re-grant execute permissions
-- ============================================================
grant execute on function public.get_mutasi_bank(uuid, int, int) to authenticated;
grant execute on function public.get_ereceipt(int, int) to authenticated;
grant execute on function public.get_search(int, int, text, text) to authenticated;

-- ============================================================
-- 5. Verify functions exist
-- ============================================================
select
  proname as function_name,
  pg_get_function_arguments(oid) as args
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('get_mutasi_bank', 'get_ereceipt', 'get_search')
order by proname;
