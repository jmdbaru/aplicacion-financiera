create table public.split_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  event_type text not null default 'event' check (event_type in ('trip','event','home','other')),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  notes text,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.split_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.split_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique(event_id, name)
);
create table public.split_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.split_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payer_id uuid not null references public.split_participants(id) on delete restrict,
  description text not null check (char_length(trim(description)) between 1 and 120),
  amount numeric(20,4) not null check (amount > 0),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);
create table public.split_expense_participants (
  expense_id uuid not null references public.split_expenses(id) on delete cascade,
  participant_id uuid not null references public.split_participants(id) on delete restrict,
  primary key(expense_id, participant_id)
);
create index split_events_user_created_idx on public.split_events(user_id, created_at desc);
create index split_participants_event_idx on public.split_participants(event_id);
create index split_expenses_event_date_idx on public.split_expenses(event_id, expense_date desc);
alter table public.split_events enable row level security;
alter table public.split_participants enable row level security;
alter table public.split_expenses enable row level security;
alter table public.split_expense_participants enable row level security;
create policy split_events_own on public.split_events for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy split_participants_own on public.split_participants for all to authenticated using (exists(select 1 from public.split_events e where e.id=event_id and e.user_id=(select auth.uid()))) with check (exists(select 1 from public.split_events e where e.id=event_id and e.user_id=(select auth.uid())) and user_id=(select auth.uid()));
create policy split_expenses_own on public.split_expenses for all to authenticated using (exists(select 1 from public.split_events e where e.id=event_id and e.user_id=(select auth.uid()))) with check (exists(select 1 from public.split_events e where e.id=event_id and e.user_id=(select auth.uid())) and user_id=(select auth.uid()));
create policy split_expense_participants_own on public.split_expense_participants for all to authenticated using (exists(select 1 from public.split_expenses x join public.split_events e on e.id=x.event_id where x.id=expense_id and e.user_id=(select auth.uid()))) with check (exists(select 1 from public.split_expenses x join public.split_events e on e.id=x.event_id where x.id=expense_id and e.user_id=(select auth.uid())));
revoke all on public.split_events,public.split_participants,public.split_expenses,public.split_expense_participants from anon;
grant select,insert,update,delete on public.split_events,public.split_participants,public.split_expenses,public.split_expense_participants to authenticated;
