-- Fase 7: objetivos y aportaciones. El progreso se deriva, nunca se guarda como saldo mutable.
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  target_amount numeric(20,4) not null check (target_amount > 0),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  target_date date,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,id)
);
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  goal_id uuid not null,
  amount numeric(20,4) not null check (amount > 0),
  contributed_on date not null default current_date,
  note text check (char_length(trim(note)) <= 240),
  created_at timestamptz not null default now(),
  foreign key (user_id,goal_id) references public.savings_goals(user_id,id) on delete cascade
);
create index goal_contributions_goal_date_idx on public.goal_contributions(user_id,goal_id,contributed_on desc);
alter table public.savings_goals enable row level security;
alter table public.savings_goals force row level security;
alter table public.goal_contributions enable row level security;
alter table public.goal_contributions force row level security;
create policy savings_goals_own on public.savings_goals for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy goal_contributions_own on public.goal_contributions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.savings_goals,public.goal_contributions from public,anon,authenticated;
grant select,insert,update,delete on public.savings_goals,public.goal_contributions to authenticated;
create or replace function public.get_savings_goals_overview()
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'target_amount',g.target_amount,'currency_code',g.currency_code,'target_date',g.target_date,'status',g.status,'contributed',coalesce(c.contributed,0),'remaining',greatest(g.target_amount-coalesce(c.contributed,0),0),'progress_pct',least(round(coalesce(c.contributed,0)/g.target_amount*100,2),100)) order by g.created_at desc),'[]'::jsonb)
  from public.savings_goals g left join lateral (select sum(amount) contributed from public.goal_contributions where goal_id=g.id and user_id=g.user_id) c on true
  where g.user_id=auth.uid();
$$;
revoke execute on function public.get_savings_goals_overview() from public,anon;
grant execute on function public.get_savings_goals_overview() to authenticated;
