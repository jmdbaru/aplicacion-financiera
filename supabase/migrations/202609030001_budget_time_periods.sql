-- Presupuestos por día, semana, mes o año. El catálogo temporal evita valores
-- libres y deja una relación estable para informes y automatizaciones futuras.
create table public.budget_time_periods (
  id smallint primary key,
  code text not null unique check (code in ('day', 'week', 'month', 'year')),
  label text not null unique,
  sort_order smallint not null unique check (sort_order between 1 and 4)
);

insert into public.budget_time_periods (id, code, label, sort_order) values
  (1, 'day', 'Día', 1),
  (2, 'week', 'Semana', 2),
  (3, 'month', 'Mes', 3),
  (4, 'year', 'Año', 4);

alter table public.budget_time_periods enable row level security;
alter table public.budget_time_periods force row level security;
create policy budget_time_periods_select_authenticated on public.budget_time_periods
  for select to authenticated using (true);
revoke all on public.budget_time_periods from public, anon, authenticated;
grant select on public.budget_time_periods to authenticated;

create or replace function public.normalize_budget_period(p_date date, p_time_period_id smallint)
returns date
language sql
immutable
set search_path = pg_catalog
as $$
  select case p_time_period_id
    when 1 then p_date
    when 2 then date_trunc('week', p_date)::date
    when 3 then date_trunc('month', p_date)::date
    when 4 then date_trunc('year', p_date)::date
    else null
  end;
$$;

alter table public.budgets
  add column time_period_id smallint not null default 3;
alter table public.budgets
  add constraint budgets_time_period_id_fkey
  foreign key (time_period_id) references public.budget_time_periods(id) on delete restrict;
alter table public.budgets
  drop constraint budgets_period_start_check,
  drop constraint budgets_user_id_category_id_period_start_currency_code_key;
alter table public.budgets
  add constraint budgets_period_start_normalized_check
    check (period_start = public.normalize_budget_period(period_start, time_period_id)),
  add constraint budgets_user_category_period_currency_time_key
    unique (user_id, category_id, period_start, currency_code, time_period_id);
create index budgets_user_time_period_idx
  on public.budgets (user_id, time_period_id, period_start desc, currency_code, category_id);

drop function public.get_budget_overview(date, text);
create function public.get_budget_overview(
  p_period_start date,
  p_currency_code text,
  p_time_period_id smallint default 3
) returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_period_start date;
  v_period_end date;
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_currency_code !~ '^[A-Z]{3}$' or not exists (
    select 1 from public.budget_time_periods where id = p_time_period_id
  ) then raise exception 'invalid_budget_period'; end if;

  v_period_start := public.normalize_budget_period(p_period_start, p_time_period_id);
  v_period_end := case p_time_period_id
    when 1 then v_period_start + interval '1 day'
    when 2 then v_period_start + interval '1 week'
    when 3 then v_period_start + interval '1 month'
    when 4 then v_period_start + interval '1 year'
  end;

  with spending as (
    select coalesce(c.parent_id, t.category_id) as root_category_id,
      sum(-e.amount)::numeric(20,4) as spent
    from public.ledger_transactions t
    join public.ledger_entries e on e.user_id = t.user_id and e.transaction_id = t.id
      and e.entry_kind = 'account' and e.currency_code = p_currency_code
    left join public.categories c on c.id = t.category_id
    left join public.ledger_transactions original on original.user_id = t.user_id
      and original.id = t.reversed_transaction_id
    where t.user_id = v_user_id and t.effective_date >= v_period_start and t.effective_date < v_period_end
      and (t.transaction_type = 'expense' or (t.transaction_type = 'reversal' and original.transaction_type = 'expense'))
    group by coalesce(c.parent_id, t.category_id)
  ), budget_rows as (
    select b.id, b.category_id, c.name as category_name, c.icon, c.color, b.amount,
      b.alert_threshold_pct, b.time_period_id, coalesce(s.spent, 0)::numeric(20,4) as spent,
      (b.amount - coalesce(s.spent, 0))::numeric(20,4) as remaining,
      round((coalesce(s.spent, 0) / b.amount) * 100, 2) as usage_pct
    from public.budgets b
    join public.categories c on c.id = b.category_id
    left join spending s on s.root_category_id = b.category_id
    where b.user_id = v_user_id and b.period_start = v_period_start
      and b.time_period_id = p_time_period_id and b.currency_code = p_currency_code
  )
  select jsonb_build_object(
    'period_start', v_period_start, 'currency_code', p_currency_code,
    'time_period_id', p_time_period_id,
    'total_budget', coalesce((select sum(amount) from budget_rows), 0),
    'budgeted_spent', coalesce((select sum(spent) from budget_rows), 0),
    'outside_budget_spent', coalesce((select sum(s.spent) from spending s where s.root_category_id is null or not exists (select 1 from budget_rows b where b.category_id = s.root_category_id)), 0),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'category_id', category_id, 'category_name', category_name, 'icon', icon,
      'color', color, 'amount', amount, 'alert_threshold_pct', alert_threshold_pct,
      'time_period_id', time_period_id, 'spent', spent, 'remaining', remaining,
      'usage_pct', usage_pct, 'status', case when usage_pct >= 100 then 'exceeded' when usage_pct >= alert_threshold_pct then 'warning' else 'ok' end
    ) order by usage_pct desc, category_name) from budget_rows), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke execute on function public.normalize_budget_period(date, smallint) from public, anon, authenticated;
revoke execute on function public.get_budget_overview(date, text, smallint) from public, anon;
grant execute on function public.get_budget_overview(date, text, smallint) to authenticated;
