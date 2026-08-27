-- Fase 4: categorías configurables, presupuestos mensuales y progreso agregado.
-- Conserva el catálogo global preexistente y endurece sus políticas.

alter table public.categories
  add column parent_id uuid references public.categories(id) on delete restrict,
  add column is_active boolean not null default true,
  add column archived_at timestamptz,
  add column updated_at timestamptz not null default now();

alter table public.categories
  alter column is_default set not null,
  alter column created_at set not null,
  add constraint categories_name_check
    check (char_length(trim(name)) between 1 and 80),
  add constraint categories_color_check
    check (color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint categories_icon_check
    check (char_length(trim(icon)) between 1 and 50),
  add constraint categories_scope_check
    check ((is_default and user_id is null) or (not is_default and user_id is not null)),
  add constraint categories_parent_not_self_check
    check (parent_id is null or parent_id <> id),
  add constraint categories_archive_state_check
    check ((is_active and archived_at is null) or not is_active),
  add constraint categories_user_id_id_key unique (user_id, id);

create unique index categories_default_name_idx
  on public.categories (lower(name))
  where is_default and parent_id is null;

create unique index categories_user_name_parent_idx
  on public.categories (
    user_id,
    lower(name),
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where user_id is not null;

create index categories_user_active_idx
  on public.categories (user_id, is_active, parent_id, name);

create or replace function public.validate_category_hierarchy()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_parent public.categories%rowtype;
begin
  new.name := trim(new.name);
  new.icon := trim(new.icon);
  new.updated_at := now();

  if new.is_default and new.parent_id is not null then
    raise exception 'default_category_cannot_have_parent';
  end if;

  if new.parent_id is not null then
    select * into v_parent
    from public.categories
    where id = new.parent_id;

    if not found
      or v_parent.parent_id is not null
      or not v_parent.is_active
      or not (v_parent.is_default or v_parent.user_id = new.user_id)
      or (v_parent.type <> 'both' and v_parent.type <> new.type)
    then
      raise exception 'invalid_parent_category';
    end if;
  end if;

  return new;
end;
$$;

create trigger categories_validate_hierarchy
before insert or update on public.categories
for each row execute function public.validate_category_hierarchy();

drop policy if exists "Users can delete their own categories" on public.categories;
drop policy if exists "Users can insert their own categories" on public.categories;
drop policy if exists "Users can update their own categories" on public.categories;
drop policy if exists "Users can view their own and default categories" on public.categories;

alter table public.categories enable row level security;
alter table public.categories force row level security;

create policy categories_select_visible
on public.categories for select
to authenticated
using (is_default or (select auth.uid()) = user_id);

create policy categories_insert_own
on public.categories for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and not is_default
);

create policy categories_update_own
on public.categories for update
to authenticated
using ((select auth.uid()) = user_id and not is_default)
with check ((select auth.uid()) = user_id and not is_default);

revoke all on public.categories from public, anon, authenticated;
grant select, insert, update on public.categories to authenticated;

revoke execute on function public.validate_category_hierarchy() from public, anon, authenticated;

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  period_start date not null,
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  amount numeric(20,4) not null check (amount > 0),
  alert_threshold_pct smallint not null default 80
    check (alert_threshold_pct between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, category_id, period_start, currency_code),
  check (period_start = date_trunc('month', period_start)::date)
);

create index budgets_user_period_idx
  on public.budgets (user_id, period_start desc, currency_code, category_id);

create or replace function public.validate_budget_category()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_category public.categories%rowtype;
begin
  select * into v_category
  from public.categories
  where id = new.category_id;

  if not found
    or not v_category.is_active
    or v_category.parent_id is not null
    or v_category.type not in ('expense', 'both')
    or not (v_category.is_default or v_category.user_id = new.user_id)
  then
    raise exception 'invalid_budget_category';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger budgets_validate_category
before insert or update on public.budgets
for each row execute function public.validate_budget_category();

alter table public.budgets enable row level security;
alter table public.budgets force row level security;

create policy budgets_select_own
on public.budgets for select
to authenticated
using ((select auth.uid()) = user_id);

create policy budgets_insert_own
on public.budgets for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy budgets_update_own
on public.budgets for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy budgets_delete_own
on public.budgets for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.budgets from public, anon, authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
revoke execute on function public.validate_budget_category() from public, anon, authenticated;

alter table public.ledger_transactions
  add column category_id uuid references public.categories(id) on delete restrict;

alter table public.ledger_transactions
  add constraint ledger_transactions_category_type_check
  check (
    (transaction_type in ('transfer', 'adjustment') and category_id is null)
    or transaction_type in ('income', 'expense', 'reversal')
  );

create index ledger_transactions_user_category_date_idx
  on public.ledger_transactions (user_id, category_id, effective_date desc)
  where category_id is not null;

drop function public.create_ledger_transaction(date, text, text, jsonb);

create function public.create_ledger_transaction(
  p_effective_date date,
  p_description text,
  p_transaction_type text,
  p_entries jsonb,
  p_category_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction_id uuid := gen_random_uuid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_effective_date is null or char_length(trim(p_description)) not between 1 and 240 then raise exception 'invalid_transaction'; end if;
  if p_transaction_type not in ('income','expense','transfer','adjustment') then raise exception 'invalid_transaction_type'; end if;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) < 2 then raise exception 'at_least_two_entries_required'; end if;

  if p_transaction_type in ('transfer', 'adjustment') and p_category_id is not null then
    raise exception 'category_not_allowed';
  end if;

  if p_category_id is not null and not exists (
    select 1
    from public.categories c
    where c.id = p_category_id
      and c.is_active
      and (c.is_default or c.user_id = v_user_id)
      and (c.type = p_transaction_type or c.type = 'both')
  ) then
    raise exception 'invalid_category';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_entries) as e(account_id uuid, entry_kind text, currency_code text, amount numeric)
    where e.amount is null or e.amount = 0 or e.currency_code !~ '^[A-Z]{3}$'
      or e.entry_kind not in ('account','external')
      or (e.entry_kind = 'account') <> (e.account_id is not null)
  ) then raise exception 'invalid_entry'; end if;

  if exists (
    select 1 from jsonb_to_recordset(p_entries) as e(account_id uuid, entry_kind text, currency_code text, amount numeric)
    left join public.financial_accounts a on a.id=e.account_id and a.user_id=v_user_id
    where e.entry_kind='account' and (a.id is null or not a.is_active or a.currency_code<>e.currency_code)
  ) then raise exception 'invalid_account'; end if;

  if exists (
    select 1 from jsonb_to_recordset(p_entries) as e(account_id uuid, entry_kind text, currency_code text, amount numeric)
    group by e.currency_code having sum(e.amount) <> 0
  ) then raise exception 'unbalanced_transaction'; end if;

  if p_transaction_type='transfer' and exists (
    select 1 from jsonb_to_recordset(p_entries) as e(account_id uuid, entry_kind text, currency_code text, amount numeric)
    where e.entry_kind<>'account'
  ) then raise exception 'transfer_requires_accounts'; end if;

  insert into public.ledger_transactions(
    id, user_id, effective_date, description, transaction_type, category_id
  ) values (
    v_transaction_id, v_user_id, p_effective_date, trim(p_description),
    p_transaction_type, p_category_id
  );

  insert into public.ledger_entries(
    user_id, transaction_id, account_id, entry_kind, currency_code, amount
  )
  select v_user_id, v_transaction_id, e.account_id, e.entry_kind, e.currency_code, e.amount
  from jsonb_to_recordset(p_entries) as e(account_id uuid, entry_kind text, currency_code text, amount numeric);

  return v_transaction_id;
end;
$$;

create or replace function public.reverse_ledger_transaction(
  p_transaction_id uuid,
  p_effective_date date,
  p_description text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_original public.ledger_transactions%rowtype;
  v_reversal_id uuid := gen_random_uuid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  select * into v_original from public.ledger_transactions where id=p_transaction_id and user_id=v_user_id for update;
  if not found or v_original.transaction_type='reversal' then raise exception 'transaction_not_reversible'; end if;
  if exists(select 1 from public.ledger_transactions where reversed_transaction_id=p_transaction_id) then raise exception 'transaction_already_reversed'; end if;

  insert into public.ledger_transactions(
    id, user_id, effective_date, description, transaction_type,
    reversed_transaction_id, category_id
  ) values (
    v_reversal_id, v_user_id, p_effective_date,
    coalesce(nullif(trim(p_description),''),'Reverso: '||v_original.description),
    'reversal', p_transaction_id, v_original.category_id
  );

  insert into public.ledger_entries(
    user_id, transaction_id, account_id, entry_kind, currency_code, amount
  )
  select user_id, v_reversal_id, account_id, entry_kind, currency_code, -amount
  from public.ledger_entries
  where transaction_id=p_transaction_id and user_id=v_user_id;

  return v_reversal_id;
end;
$$;

revoke execute on function public.create_ledger_transaction(date,text,text,jsonb,uuid) from public, anon;
revoke execute on function public.reverse_ledger_transaction(uuid,date,text) from public, anon;
grant execute on function public.create_ledger_transaction(date,text,text,jsonb,uuid) to authenticated;
grant execute on function public.reverse_ledger_transaction(uuid,date,text) to authenticated;

create or replace function public.get_budget_overview(
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
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_period_start is null
    or p_period_start <> date_trunc('month', p_period_start)::date
    or p_currency_code !~ '^[A-Z]{3}$'
  then raise exception 'invalid_budget_period'; end if;

  with spending as (
    select
      coalesce(c.parent_id, t.category_id) as root_category_id,
      sum(-e.amount)::numeric(20,4) as spent
    from public.ledger_transactions t
    join public.ledger_entries e
      on e.user_id = t.user_id
     and e.transaction_id = t.id
     and e.entry_kind = 'account'
     and e.currency_code = p_currency_code
    left join public.categories c on c.id = t.category_id
    left join public.ledger_transactions original
      on original.user_id = t.user_id
     and original.id = t.reversed_transaction_id
    where t.user_id = v_user_id
      and t.effective_date >= p_period_start
      and t.effective_date < (p_period_start + interval '1 month')
      and (
        t.transaction_type = 'expense'
        or (t.transaction_type = 'reversal' and original.transaction_type = 'expense')
      )
    group by coalesce(c.parent_id, t.category_id)
  ), budget_rows as (
    select
      b.id,
      b.category_id,
      c.name as category_name,
      c.icon,
      c.color,
      b.amount,
      b.alert_threshold_pct,
      coalesce(s.spent, 0)::numeric(20,4) as spent,
      (b.amount - coalesce(s.spent, 0))::numeric(20,4) as remaining,
      round((coalesce(s.spent, 0) / b.amount) * 100, 2) as usage_pct
    from public.budgets b
    join public.categories c on c.id = b.category_id
    left join spending s on s.root_category_id = b.category_id
    where b.user_id = v_user_id
      and b.period_start = p_period_start
      and b.currency_code = p_currency_code
  )
  select jsonb_build_object(
    'period_start', p_period_start,
    'currency_code', p_currency_code,
    'total_budget', coalesce((select sum(amount) from budget_rows), 0),
    'budgeted_spent', coalesce((select sum(spent) from budget_rows), 0),
    'outside_budget_spent', coalesce((
      select sum(s.spent)
      from spending s
      where s.root_category_id is null
         or not exists (select 1 from budget_rows b where b.category_id = s.root_category_id)
    ), 0),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'category_id', category_id,
          'category_name', category_name,
          'icon', icon,
          'color', color,
          'amount', amount,
          'alert_threshold_pct', alert_threshold_pct,
          'spent', spent,
          'remaining', remaining,
          'usage_pct', usage_pct,
          'status', case
            when usage_pct >= 100 then 'exceeded'
            when usage_pct >= alert_threshold_pct then 'warning'
            else 'ok'
          end
        ) order by usage_pct desc, category_name
      ) from budget_rows
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.get_budget_overview(date,text) from public, anon;
grant execute on function public.get_budget_overview(date,text) to authenticated;
