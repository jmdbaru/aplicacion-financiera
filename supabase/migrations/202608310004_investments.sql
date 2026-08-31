-- Fase 11: inversiones. Operaciones y valoraciones no duplican efectivo del ledger.
create table public.investment_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  cash_account_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (user_id, cash_account_id) references public.financial_accounts(user_id, id) on delete restrict,
  unique (user_id, id)
);

create table public.investment_instruments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (char_length(trim(symbol)) between 1 and 24),
  name text not null check (char_length(trim(name)) between 1 and 160),
  instrument_type text not null check (instrument_type in ('stock', 'fund', 'etf', 'bond', 'crypto', 'other')),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  unique (user_id, symbol),
  unique (user_id, id)
);

create table public.investment_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  portfolio_id uuid not null,
  instrument_id uuid not null,
  operation_date date not null,
  operation_type text not null check (operation_type in ('buy', 'sell', 'dividend', 'fee')),
  quantity numeric(24,8) not null check (quantity >= 0),
  price numeric(20,6) not null default 0 check (price >= 0),
  fees numeric(20,4) not null default 0 check (fees >= 0),
  notes text check (notes is null or char_length(notes) <= 240),
  created_at timestamptz not null default now(),
  foreign key (user_id, portfolio_id) references public.investment_portfolios(user_id, id) on delete cascade,
  foreign key (user_id, instrument_id) references public.investment_instruments(user_id, id) on delete restrict
);

create table public.investment_valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  instrument_id uuid not null,
  valuation_date date not null default current_date,
  price numeric(20,6) not null check (price >= 0),
  source text not null default 'manual' check (char_length(trim(source)) between 1 and 80),
  created_at timestamptz not null default now(),
  foreign key (user_id, instrument_id) references public.investment_instruments(user_id, id) on delete cascade,
  unique (user_id, instrument_id, valuation_date)
);

create index investment_portfolios_user_active_idx on public.investment_portfolios (user_id, is_active);
create index investment_operations_portfolio_date_idx on public.investment_operations (user_id, portfolio_id, operation_date desc);
create index investment_valuations_instrument_date_idx on public.investment_valuations (user_id, instrument_id, valuation_date desc);

alter table public.investment_portfolios enable row level security;
alter table public.investment_instruments enable row level security;
alter table public.investment_operations enable row level security;
alter table public.investment_valuations enable row level security;
alter table public.investment_portfolios force row level security;
alter table public.investment_instruments force row level security;
alter table public.investment_operations force row level security;
alter table public.investment_valuations force row level security;

create policy "investment_portfolios_select_own" on public.investment_portfolios for select to authenticated using ((select auth.uid()) = user_id);
create policy "investment_portfolios_insert_own" on public.investment_portfolios for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "investment_portfolios_update_own" on public.investment_portfolios for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "investment_instruments_select_own" on public.investment_instruments for select to authenticated using ((select auth.uid()) = user_id);
create policy "investment_instruments_insert_own" on public.investment_instruments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "investment_operations_select_own" on public.investment_operations for select to authenticated using ((select auth.uid()) = user_id);
create policy "investment_operations_insert_own" on public.investment_operations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "investment_valuations_select_own" on public.investment_valuations for select to authenticated using ((select auth.uid()) = user_id);
create policy "investment_valuations_insert_own" on public.investment_valuations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "investment_valuations_update_own" on public.investment_valuations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.investment_portfolios, public.investment_instruments, public.investment_operations, public.investment_valuations from anon, authenticated;
grant select, insert, update on public.investment_portfolios, public.investment_valuations to authenticated;
grant select, insert on public.investment_instruments, public.investment_operations to authenticated;

create or replace function public.get_investments_overview()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with positions as (
    select
      p.id as portfolio_id,
      p.name as portfolio_name,
      p.currency_code,
      i.id as instrument_id,
      i.symbol,
      i.name as instrument_name,
      coalesce(sum(case when o.operation_type = 'buy' then o.quantity when o.operation_type = 'sell' then -o.quantity else 0 end), 0) as quantity,
      coalesce(sum(case when o.operation_type = 'buy' then (o.quantity * o.price) + o.fees when o.operation_type = 'sell' then -((o.quantity * o.price) - o.fees) when o.operation_type = 'fee' then o.fees else 0 end), 0) as cost_basis,
      coalesce(sum(case when o.operation_type = 'dividend' then o.price else 0 end), 0) as dividends
    from public.investment_portfolios p
    join public.investment_operations o on o.user_id = p.user_id and o.portfolio_id = p.id
    join public.investment_instruments i on i.user_id = p.user_id and i.id = o.instrument_id
    where p.user_id = (select auth.uid()) and p.is_active
    group by p.id, p.name, p.currency_code, i.id, i.symbol, i.name
  ), latest_prices as (
    select distinct on (v.user_id, v.instrument_id)
      v.instrument_id,
      v.price,
      v.valuation_date
    from public.investment_valuations v
    where v.user_id = (select auth.uid())
    order by v.user_id, v.instrument_id, v.valuation_date desc, v.created_at desc
  ), enriched as (
    select
      positions.*,
      coalesce(latest_prices.price, 0) as latest_price,
      latest_prices.valuation_date,
      (positions.quantity * coalesce(latest_prices.price, 0))::numeric(20,4) as market_value,
      ((positions.quantity * coalesce(latest_prices.price, 0)) - positions.cost_basis + positions.dividends)::numeric(20,4) as unrealized_result
    from positions
    left join latest_prices on latest_prices.instrument_id = positions.instrument_id
  )
  select jsonb_build_object(
    'total_market_value', coalesce((select sum(market_value) from enriched), 0),
    'total_cost_basis', coalesce((select sum(cost_basis) from enriched), 0),
    'total_result', coalesce((select sum(unrealized_result) from enriched), 0),
    'positions', coalesce((select jsonb_agg(to_jsonb(enriched) order by portfolio_name, symbol) from enriched), '[]'::jsonb)
  );
$$;

grant execute on function public.get_investments_overview() to authenticated;
