-- Fase 3: cuentas privadas. Los saldos se derivarán del ledger, nunca se almacenan aquí.
create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  account_type text not null check (account_type in ('cash', 'bank', 'credit_card', 'loan', 'investment', 'other')),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check ((is_active and archived_at is null) or (not is_active))
);

create index financial_accounts_user_active_idx on public.financial_accounts (user_id, is_active, created_at desc);
alter table public.financial_accounts enable row level security;
alter table public.financial_accounts force row level security;
create policy "financial_accounts_select_own" on public.financial_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "financial_accounts_insert_own" on public.financial_accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "financial_accounts_update_own" on public.financial_accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.financial_accounts from anon;
grant select, insert, update on public.financial_accounts to authenticated;
