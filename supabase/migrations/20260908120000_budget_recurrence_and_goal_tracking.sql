-- Límites recurrentes por categoría y seguimiento de objetivos con saldo real.
alter table public.budgets
  add column starts_on date,
  add column ends_on date;

update public.budgets set starts_on = period_start where starts_on is null;

alter table public.budgets
  alter column starts_on set not null,
  add constraint budgets_date_range_check check (ends_on is null or ends_on >= starts_on);

alter table public.budgets
  drop constraint budgets_user_category_period_currency_time_key;

create unique index budgets_user_category_recurrence_start_key
  on public.budgets (user_id, category_id, currency_code, time_period_id, starts_on);

drop function public.get_budget_overview(date, text, smallint);
create function public.get_budget_overview(
  p_period_start date,
  p_currency_code text,
  p_time_period_id smallint default 3
) returns jsonb
language plpgsql stable security invoker set search_path = public, pg_temp as $$
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
    left join public.ledger_transactions original on original.user_id = t.user_id and original.id = t.reversed_transaction_id
    where t.user_id = v_user_id and t.effective_date >= v_period_start and t.effective_date < v_period_end
      and (t.transaction_type = 'expense' or (t.transaction_type = 'reversal' and original.transaction_type = 'expense'))
    group by coalesce(c.parent_id, t.category_id)
  ), active_rules as (
    select distinct on (b.category_id) b.*
    from public.budgets b
    where b.user_id = v_user_id and b.currency_code = p_currency_code and b.time_period_id = p_time_period_id
      and b.starts_on <= v_period_start and (b.ends_on is null or b.ends_on >= v_period_start)
    order by b.category_id, b.starts_on desc
  ), budget_rows as (
    select b.id, b.category_id, c.name as category_name, c.icon, c.color, b.amount, b.alert_threshold_pct,
      b.time_period_id, b.starts_on, b.ends_on, coalesce(s.spent, 0)::numeric(20,4) as spent,
      (b.amount - coalesce(s.spent, 0))::numeric(20,4) as remaining,
      round((coalesce(s.spent, 0) / b.amount) * 100, 2) as usage_pct
    from active_rules b
    join public.categories c on c.id = b.category_id
    left join spending s on s.root_category_id = b.category_id
  )
  select jsonb_build_object(
    'period_start', v_period_start, 'currency_code', p_currency_code, 'time_period_id', p_time_period_id,
    'total_budget', coalesce((select sum(amount) from budget_rows), 0),
    'budgeted_spent', coalesce((select sum(spent) from budget_rows), 0),
    'outside_budget_spent', coalesce((select sum(s.spent) from spending s where s.root_category_id is null or not exists (select 1 from budget_rows b where b.category_id = s.root_category_id)), 0),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'category_id', category_id, 'category_name', category_name, 'icon', icon, 'color', color,
      'amount', amount, 'alert_threshold_pct', alert_threshold_pct, 'time_period_id', time_period_id,
      'starts_on', starts_on, 'ends_on', ends_on, 'spent', spent, 'remaining', remaining, 'usage_pct', usage_pct,
      'status', case when usage_pct >= 100 then 'exceeded' when usage_pct >= alert_threshold_pct then 'warning' else 'ok' end
    ) order by usage_pct desc, category_name) from budget_rows), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke execute on function public.get_budget_overview(date, text, smallint) from public, anon;
grant execute on function public.get_budget_overview(date, text, smallint) to authenticated;

alter table public.savings_goals
  add column if not exists tracking_mode text not null default 'manual',
  add column if not exists linked_account_id uuid;

alter table public.savings_goals
  drop constraint if exists savings_goals_tracking_mode_check;

alter table public.savings_goals
  add constraint savings_goals_tracking_mode_check
    check ((tracking_mode = 'manual' and linked_account_id is null) or (tracking_mode = 'account_balance' and linked_account_id is not null));

do $$ begin
  if not exists (
    select 1 from pg_constraint where conrelid = 'public.savings_goals'::regclass and conname = 'savings_goals_linked_account_fkey'
  ) then
    alter table public.savings_goals add constraint savings_goals_linked_account_fkey
      foreign key (user_id, linked_account_id) references public.financial_accounts(user_id, id) on delete set null;
  end if;
end $$;

create index if not exists savings_goals_user_linked_account_idx on public.savings_goals (user_id, linked_account_id) where linked_account_id is not null;

create or replace function public.get_savings_goals_overview()
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',g.id,'name',g.name,'target_amount',g.target_amount,'currency_code',g.currency_code,'target_date',g.target_date,
    'status',g.status,'priority',g.priority,'contribution_frequency',g.contribution_frequency,
    'tracking_mode',g.tracking_mode,'linked_account_id',g.linked_account_id,'linked_account_name',a.name,
    'contributed',case when g.tracking_mode='account_balance' then greatest(coalesce(ab.balance,0),0) else coalesce(c.contributed,0) end,
    'remaining',greatest(g.target_amount - case when g.tracking_mode='account_balance' then greatest(coalesce(ab.balance,0),0) else coalesce(c.contributed,0) end,0),
    'progress_pct',least(round((case when g.tracking_mode='account_balance' then greatest(coalesce(ab.balance,0),0) else coalesce(c.contributed,0) end)/g.target_amount*100,2),100)
  ) order by case g.priority when 'high' then 1 when 'normal' then 2 else 3 end, g.target_date nulls last, g.created_at desc),'[]'::jsonb)
  from public.savings_goals g
  left join lateral (select sum(amount) contributed from public.goal_contributions where goal_id=g.id and user_id=g.user_id) c on true
  left join public.financial_accounts a on a.user_id=g.user_id and a.id=g.linked_account_id
  left join lateral (select sum(e.amount) balance from public.ledger_entries e where e.user_id=g.user_id and e.account_id=g.linked_account_id and e.currency_code=g.currency_code) ab on true
  where g.user_id=auth.uid();
$$;

revoke all on function public.get_savings_goals_overview() from public, anon;
grant execute on function public.get_savings_goals_overview() to authenticated;
