-- Fase 3: cabecera y entradas del ledger. Las operaciones se registrarán mediante RPC atómica.
create table public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_date date not null,
  description text not null check (char_length(trim(description)) between 1 and 240),
  transaction_type text not null check (transaction_type in ('income', 'expense', 'transfer', 'adjustment', 'reversal')),
  reversed_transaction_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, reversed_transaction_id) references public.ledger_transactions(user_id, id)
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  transaction_id uuid not null,
  account_id uuid,
  entry_kind text not null check (entry_kind in ('account', 'external')),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  amount numeric(20,4) not null check (amount <> 0),
  created_at timestamptz not null default now(),
  foreign key (user_id, transaction_id) references public.ledger_transactions(user_id, id) on delete restrict,
  foreign key (user_id, account_id) references public.financial_accounts(user_id, id) on delete restrict
  ,check ((entry_kind = 'account' and account_id is not null) or (entry_kind = 'external' and account_id is null))
);

create index ledger_transactions_user_date_idx on public.ledger_transactions (user_id, effective_date desc, id);
create index ledger_entries_account_date_idx on public.ledger_entries (user_id, account_id, created_at desc);
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.ledger_transactions force row level security;
alter table public.ledger_entries force row level security;
create policy "ledger_transactions_select_own" on public.ledger_transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "ledger_entries_select_own" on public.ledger_entries for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.ledger_transactions, public.ledger_entries from anon, authenticated;
grant select on public.ledger_transactions, public.ledger_entries to authenticated;
