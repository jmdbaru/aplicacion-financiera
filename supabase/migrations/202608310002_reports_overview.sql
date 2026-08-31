-- Fase 9: estadisticas e informes agregados. La RPC devuelve solo datos del usuario autenticado.
create or replace function public.get_reports_overview(
  p_date_from date,
  p_date_to date,
  p_currency_code text
) returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_days integer;
  v_previous_from date;
  v_previous_to date;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_date_from is null
    or p_date_to is null
    or p_date_to < p_date_from
    or p_currency_code !~ '^[A-Z]{3}$'
  then
    raise exception 'invalid_reports_period';
  end if;

  v_days := p_date_to - p_date_from + 1;
  v_previous_to := p_date_from - 1;
  v_previous_from := v_previous_to - (v_days - 1);

  with current_entries as (
    select t.id, t.effective_date, t.transaction_type, t.category_id, e.amount
    from public.ledger_transactions t
    join public.ledger_entries e
      on e.user_id = v_user_id
     and e.transaction_id = t.id
     and e.entry_kind = 'account'
     and e.currency_code = p_currency_code
    where t.user_id = v_user_id
      and t.effective_date between p_date_from and p_date_to
      and t.transaction_type in ('income', 'expense')
  ), previous_entries as (
    select t.transaction_type, e.amount
    from public.ledger_transactions t
    join public.ledger_entries e
      on e.user_id = v_user_id
     and e.transaction_id = t.id
     and e.entry_kind = 'account'
     and e.currency_code = p_currency_code
    where t.user_id = v_user_id
      and t.effective_date between v_previous_from and v_previous_to
      and t.transaction_type in ('income', 'expense')
  ), totals as (
    select
      coalesce(sum(amount) filter (where transaction_type = 'income'), 0)::numeric(20,4) as income,
      coalesce(-sum(amount) filter (where transaction_type = 'expense'), 0)::numeric(20,4) as expenses
    from current_entries
  ), previous_totals as (
    select
      coalesce(sum(amount) filter (where transaction_type = 'income'), 0)::numeric(20,4) as income,
      coalesce(-sum(amount) filter (where transaction_type = 'expense'), 0)::numeric(20,4) as expenses
    from previous_entries
  ), monthly as (
    select
      month_start::date as period_start,
      coalesce(sum(e.amount) filter (where t.transaction_type = 'income'), 0)::numeric(20,4) as income,
      coalesce(-sum(e.amount) filter (where t.transaction_type = 'expense'), 0)::numeric(20,4) as expenses
    from generate_series(date_trunc('month', p_date_from)::date, date_trunc('month', p_date_to)::date, interval '1 month') as month_start
    left join public.ledger_transactions t
      on t.user_id = v_user_id
     and t.effective_date >= month_start::date
     and t.effective_date < (month_start + interval '1 month')::date
     and t.transaction_type in ('income', 'expense')
    left join public.ledger_entries e
      on e.user_id = v_user_id
     and e.transaction_id = t.id
     and e.entry_kind = 'account'
     and e.currency_code = p_currency_code
    group by month_start
  ), categories as (
    select
      coalesce(c.name, 'Sin categoria') as category_name,
      ce.transaction_type,
      abs(sum(ce.amount))::numeric(20,4) as amount,
      count(distinct ce.id)::integer as operations
    from current_entries ce
    left join public.categories c on c.id = ce.category_id and (c.user_id = v_user_id or c.user_id is null)
    group by coalesce(c.name, 'Sin categoria'), ce.transaction_type
  )
  select jsonb_build_object(
    'date_from', p_date_from,
    'date_to', p_date_to,
    'currency_code', p_currency_code,
    'income', (select income from totals),
    'expenses', (select expenses from totals),
    'balance', (select income - expenses from totals),
    'previous_income', (select income from previous_totals),
    'previous_expenses', (select expenses from previous_totals),
    'previous_balance', (select income - expenses from previous_totals),
    'monthly', coalesce((select jsonb_agg(jsonb_build_object(
      'period_start', period_start,
      'income', income,
      'expenses', expenses,
      'balance', income - expenses
    ) order by period_start) from monthly), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(jsonb_build_object(
      'category_name', category_name,
      'transaction_type', transaction_type,
      'amount', amount,
      'operations', operations
    ) order by amount desc, category_name) from categories), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.get_reports_overview(date,date,text) from public, anon;
grant execute on function public.get_reports_overview(date,date,text) to authenticated;
