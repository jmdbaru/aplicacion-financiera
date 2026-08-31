-- Fase 8: patrimonio. Las valoraciones no generan movimientos de efectivo.
create table public.wealth_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  item_type text not null check (item_type in ('asset', 'liability')),
  category text not null check (category in ('property', 'vehicle', 'investment', 'cash_equivalent', 'loan', 'mortgage', 'credit', 'other')),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  notes text check (notes is null or char_length(notes) <= 240),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.wealth_valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  item_id uuid not null,
  valuation_date date not null default current_date,
  amount numeric(20,4) not null check (amount >= 0),
  source text not null default 'manual' check (char_length(trim(source)) between 1 and 80),
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now(),
  foreign key (user_id, item_id) references public.wealth_items(user_id, id) on delete cascade,
  unique (user_id, item_id, valuation_date)
);

create index wealth_items_user_active_idx on public.wealth_items (user_id, is_active, item_type);
create index wealth_valuations_item_date_idx on public.wealth_valuations (user_id, item_id, valuation_date desc);

alter table public.wealth_items enable row level security;
alter table public.wealth_valuations enable row level security;
alter table public.wealth_items force row level security;
alter table public.wealth_valuations force row level security;

create policy "wealth_items_select_own" on public.wealth_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "wealth_items_insert_own" on public.wealth_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wealth_items_update_own" on public.wealth_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "wealth_valuations_select_own" on public.wealth_valuations for select to authenticated using ((select auth.uid()) = user_id);
create policy "wealth_valuations_insert_own" on public.wealth_valuations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wealth_valuations_update_own" on public.wealth_valuations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.wealth_items, public.wealth_valuations from anon, authenticated;
grant select, insert, update on public.wealth_items, public.wealth_valuations to authenticated;

create or replace function public.get_wealth_overview()
returns table (
  id uuid,
  name text,
  item_type text,
  category text,
  currency_code char(3),
  notes text,
  is_active boolean,
  latest_amount numeric,
  latest_date date,
  previous_amount numeric,
  change_amount numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with ranked as (
    select
      v.*,
      row_number() over (partition by v.user_id, v.item_id order by v.valuation_date desc, v.created_at desc) as rn
    from public.wealth_valuations v
    where v.user_id = (select auth.uid())
  )
  select
    i.id,
    i.name,
    i.item_type,
    i.category,
    i.currency_code,
    i.notes,
    i.is_active,
    coalesce(current_value.amount, 0) as latest_amount,
    current_value.valuation_date as latest_date,
    previous_value.amount as previous_amount,
    coalesce(current_value.amount, 0) - coalesce(previous_value.amount, coalesce(current_value.amount, 0)) as change_amount
  from public.wealth_items i
  left join ranked current_value on current_value.item_id = i.id and current_value.rn = 1
  left join ranked previous_value on previous_value.item_id = i.id and previous_value.rn = 2
  where i.user_id = (select auth.uid())
  order by i.is_active desc, i.item_type, i.name;
$$;

grant execute on function public.get_wealth_overview() to authenticated;
