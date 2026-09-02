create table public.split_settlements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.split_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payer_id uuid not null references public.split_participants(id) on delete restrict,
  recipient_id uuid not null references public.split_participants(id) on delete restrict,
  amount numeric(20,4) not null check (amount > 0),
  settled_on date not null default current_date,
  created_at timestamptz not null default now(),
  check (payer_id <> recipient_id)
);

create index split_settlements_event_date_idx on public.split_settlements(event_id, settled_on desc);

alter table public.split_settlements enable row level security;

create policy split_settlements_own on public.split_settlements for all to authenticated
  using (exists(select 1 from public.split_events e where e.id = event_id and e.user_id = (select auth.uid())))
  with check (exists(select 1 from public.split_events e where e.id = event_id and e.user_id = (select auth.uid())) and user_id = (select auth.uid()));

revoke all on public.split_settlements from anon;
grant select,insert,update,delete on public.split_settlements to authenticated;

create table public.transaction_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 240),
  transaction_type text not null check (transaction_type in ('income','expense')),
  category_id uuid references public.categories(id) on delete set null,
  default_amount numeric(20,4) check (default_amount is null or default_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transaction_library_items_user_type_created_idx on public.transaction_library_items(user_id, transaction_type, created_at desc);

alter table public.transaction_library_items enable row level security;

create policy transaction_library_items_own on public.transaction_library_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.transaction_library_items from anon;
grant select,insert,update,delete on public.transaction_library_items to authenticated;
