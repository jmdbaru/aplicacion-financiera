-- Fase 5: resumen financiero agregado. No expone filas de otros usuarios ni sobrecarga el cliente.
create or replace function public.get_dashboard_overview(
  p_period_start date,
  p_currency_code text
) returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_period_start is null
    or p_period_start <> date_trunc('month', p_period_start)::date
    or p_currency_code !~ '^[A-Z]{3}$'
  then
    raise exception 'invalid_dashboard_period';
  end if;

  with period_transactions as (
    select t.id, t.effective_date, t.description, t.transaction_type, t.category_id,
      t.reversed_transaction_id
    from public.ledger_transactions t
    where t.user_id = v_user_id
      and t.effective_date >= p_period_start
      and t.effective_date < p_period_start + interval '1 month'
  ), period_entries as (
    select t.id, t.effective_date, t.description, t.transaction_type, t.category_id,
      t.reversed_transaction_id, e.amount
    from period_transactions t
    join public.ledger_entries e
      on e.user_id = v_user_id
     and e.transaction_id = t.id
     and e.entry_kind = 'account'
     and e.currency_code = p_currency_code
  ), period_totals as (
    select
      coalesce(sum(pe.amount) filter (
        where pe.transaction_type = 'income'
          or (pe.transaction_type = 'reversal' and original.transaction_type = 'income')
      ), 0)::numeric(20,4) as income,
      coalesce(-sum(pe.amount) filter (
        where pe.transaction_type = 'expense'
          or (pe.transaction_type = 'reversal' and original.transaction_type = 'expense')
      ), 0)::numeric(20,4) as expenses
    from period_entries pe
    left join public.ledger_transactions original
      on original.user_id = v_user_id
     and original.id = pe.reversed_transaction_id
  ), monthly as (
    select
      month_start::date,
      coalesce(sum(e.amount) filter (
        where t.transaction_type = 'income'
          or (t.transaction_type = 'reversal' and original.transaction_type = 'income')
      ), 0)::numeric(20,4) as income,
      coalesce(-sum(e.amount) filter (
        where t.transaction_type = 'expense'
          or (t.transaction_type = 'reversal' and original.transaction_type = 'expense')
      ), 0)::numeric(20,4) as expenses
    from generate_series(
      p_period_start - interval '5 months', p_period_start, interval '1 month'
    ) as month_start
    left join public.ledger_transactions t
      on t.user_id = v_user_id
     and t.effective_date >= month_start::date
     and t.effective_date < (month_start + interval '1 month')::date
    left join public.ledger_entries e
      on e.user_id = v_user_id
     and e.transaction_id = t.id
     and e.entry_kind = 'account'
     and e.currency_code = p_currency_code
    left join public.ledger_transactions original
      on original.user_id = v_user_id
     and original.id = t.reversed_transaction_id
    group by month_start
  ), recent as (
    select
      pe.id, max(pe.effective_date) as effective_date, max(pe.description) as description,
      max(pe.transaction_type) as transaction_type, max(c.name) as category_name,
      sum(pe.amount)::numeric(20,4) as amount
    from period_entries pe
    left join public.categories c on c.id = pe.category_id
    group by pe.id
    order by max(pe.effective_date) desc, pe.id desc
    limit 5
  )
  select jsonb_build_object(
    'period_start', p_period_start,
    'currency_code', p_currency_code,
    'available', coalesce((
      select sum(e.amount)
      from public.ledger_entries e
      join public.financial_accounts a
        on a.id = e.account_id and a.user_id = v_user_id and a.is_active
      where e.user_id = v_user_id
        and e.entry_kind = 'account'
        and e.currency_code = p_currency_code
    ), 0),
    'active_accounts', (select count(*) from public.financial_accounts a
      where a.user_id = v_user_id and a.is_active and a.currency_code = p_currency_code),
    'income', (select income from period_totals),
    'expenses', (select expenses from period_totals),
    'balance', (select income - expenses from period_totals),
    'budget', public.get_budget_overview(p_period_start, p_currency_code),
    'monthly', coalesce((select jsonb_agg(jsonb_build_object(
      'period_start', month_start, 'income', income, 'expenses', expenses,
      'balance', income - expenses
    ) order by month_start) from monthly), '[]'::jsonb),
    'recent_transactions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'effective_date', effective_date, 'description', description,
      'transaction_type', transaction_type, 'category_name', category_name, 'amount', amount
    ) order by effective_date desc, id desc) from recent), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.get_dashboard_overview(date,text) from public, anon;
grant execute on function public.get_dashboard_overview(date,text) to authenticated;
