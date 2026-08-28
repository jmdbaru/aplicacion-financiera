-- Fase 6: reglas recurrentes y ocurrencias idempotentes vinculadas al ledger.
create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  transaction_type text not null check (transaction_type in ('income','expense','transfer','adjustment')),
  account_id uuid not null,
  destination_account_id uuid,
  category_id uuid references public.categories(id) on delete restrict,
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  amount numeric(20,4) not null check (amount > 0),
  adjustment_direction text check (adjustment_direction in ('credit','debit')),
  frequency text not null check (frequency in ('daily','weekly','monthly')),
  interval_count smallint not null default 1 check (interval_count between 1 and 12),
  weekday smallint check (weekday between 0 and 6),
  monthly_day smallint check (monthly_day between 1 and 31),
  next_run_on date not null,
  end_on date,
  time_zone text not null default 'Europe/Madrid' check (char_length(time_zone) between 1 and 64),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, account_id) references public.financial_accounts(user_id, id) on delete restrict,
  foreign key (user_id, destination_account_id) references public.financial_accounts(user_id, id) on delete restrict,
  check ((transaction_type = 'transfer') = (destination_account_id is not null)),
  check ((transaction_type = 'adjustment') = (adjustment_direction is not null)),
  check (end_on is null or end_on >= next_run_on),
  check ((frequency = 'weekly') = (weekday is not null)),
  check ((frequency = 'monthly') = (monthly_day is not null))
);

create table public.recurring_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  rule_id uuid not null,
  scheduled_for date not null,
  transaction_id uuid not null,
  created_at timestamptz not null default now(),
  unique (rule_id, scheduled_for),
  unique (transaction_id),
  foreign key (user_id, rule_id) references public.recurring_rules(user_id, id) on delete cascade,
  foreign key (user_id, transaction_id) references public.ledger_transactions(user_id, id) on delete restrict
);

create index recurring_rules_due_idx on public.recurring_rules (user_id, next_run_on) where is_active;
create index recurring_occurrences_user_date_idx on public.recurring_occurrences (user_id, scheduled_for desc);

alter table public.recurring_rules enable row level security;
alter table public.recurring_rules force row level security;
alter table public.recurring_occurrences enable row level security;
alter table public.recurring_occurrences force row level security;
create policy recurring_rules_own on public.recurring_rules for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy recurring_occurrences_select_own on public.recurring_occurrences for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.recurring_rules, public.recurring_occurrences from public, anon, authenticated;
grant select, insert, update, delete on public.recurring_rules to authenticated;
grant select on public.recurring_occurrences to authenticated;

create or replace function public.next_recurring_date(
  p_current date, p_frequency text, p_interval smallint, p_monthly_day smallint
) returns date language plpgsql immutable security invoker set search_path = public, pg_temp as $$
declare v_target date;
begin
  if p_frequency = 'daily' then return p_current + p_interval; end if;
  if p_frequency = 'weekly' then return p_current + (p_interval * 7); end if;
  v_target := (date_trunc('month', p_current)::date + (p_interval || ' months')::interval)::date;
  return make_date(extract(year from v_target)::int, extract(month from v_target)::int,
    least(p_monthly_day, extract(day from (date_trunc('month', v_target) + interval '1 month - 1 day'))::int));
end;
$$;

create or replace function public.generate_recurring_transactions(p_until date)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid := auth.uid(); v_rule public.recurring_rules%rowtype; v_date date; v_transaction uuid; v_created integer := 0;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_until is null or p_until > current_date + 366 then raise exception 'invalid_generation_period'; end if;
  for v_rule in select * from public.recurring_rules where user_id=v_user_id and is_active and next_run_on<=p_until order by next_run_on for update loop
    v_date := v_rule.next_run_on;
    while v_date <= p_until and (v_rule.end_on is null or v_date <= v_rule.end_on) loop
      if not exists (select 1 from public.financial_accounts where id=v_rule.account_id and user_id=v_user_id and is_active) then
        raise exception 'recurring_account_inactive';
      end if;
      if v_rule.transaction_type='transfer' and not exists (select 1 from public.financial_accounts where id=v_rule.destination_account_id and user_id=v_user_id and is_active and currency_code=v_rule.currency_code) then
        raise exception 'recurring_destination_inactive';
      end if;
      v_transaction := public.create_ledger_transaction(v_date, v_rule.name, v_rule.transaction_type,
        case when v_rule.transaction_type='transfer' then jsonb_build_array(
          jsonb_build_object('account_id',v_rule.account_id,'entry_kind','account','currency_code',v_rule.currency_code,'amount',-v_rule.amount),
          jsonb_build_object('account_id',v_rule.destination_account_id,'entry_kind','account','currency_code',v_rule.currency_code,'amount',v_rule.amount))
        else jsonb_build_array(
          jsonb_build_object('account_id',v_rule.account_id,'entry_kind','account','currency_code',v_rule.currency_code,'amount',case when v_rule.transaction_type='expense' or (v_rule.transaction_type='adjustment' and v_rule.adjustment_direction='debit') then -v_rule.amount else v_rule.amount end),
          jsonb_build_object('account_id',null,'entry_kind','external','currency_code',v_rule.currency_code,'amount',case when v_rule.transaction_type='expense' or (v_rule.transaction_type='adjustment' and v_rule.adjustment_direction='debit') then v_rule.amount else -v_rule.amount end)) end,
        v_rule.category_id);
      insert into public.recurring_occurrences(user_id,rule_id,scheduled_for,transaction_id)
      values(v_user_id,v_rule.id,v_date,v_transaction) on conflict (rule_id,scheduled_for) do nothing;
      if found then v_created := v_created+1; end if;
      v_date := public.next_recurring_date(v_date,v_rule.frequency,v_rule.interval_count,v_rule.monthly_day);
    end loop;
    update public.recurring_rules set next_run_on=v_date, updated_at=now() where id=v_rule.id and user_id=v_user_id;
  end loop;
  return jsonb_build_object('created',v_created);
end;
$$;
revoke execute on function public.next_recurring_date(date,text,smallint,smallint) from public, anon, authenticated;
revoke execute on function public.generate_recurring_transactions(date) from public, anon;
grant execute on function public.generate_recurring_transactions(date) to authenticated;
