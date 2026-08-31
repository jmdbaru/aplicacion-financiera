-- Fase 10: importacion mediante staging, preview y reglas de categorizacion.
alter table public.ledger_transactions
add column if not exists import_row_id uuid,
add column if not exists import_fingerprint text;

create unique index if not exists ledger_transactions_import_fingerprint_idx
on public.ledger_transactions (user_id, import_fingerprint)
where import_fingerprint is not null;

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  file_name text not null check (char_length(trim(file_name)) between 1 and 180),
  source_type text not null check (source_type in ('csv', 'excel_csv')),
  status text not null default 'preview' check (status in ('preview', 'confirmed', 'failed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  foreign key (user_id, account_id) references public.financial_accounts(user_id, id) on delete restrict,
  unique (user_id, id)
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  batch_id uuid not null,
  row_number integer not null check (row_number > 0),
  raw_payload jsonb not null default '{}'::jsonb,
  effective_date date,
  description text,
  amount numeric(20,4),
  transaction_type text check (transaction_type in ('income', 'expense')),
  category_id uuid,
  fingerprint text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'invalid', 'duplicate', 'imported')),
  error_message text,
  created_transaction_id uuid,
  created_at timestamptz not null default now(),
  foreign key (user_id, batch_id) references public.import_batches(user_id, id) on delete cascade,
  foreign key (user_id, category_id) references public.categories(user_id, id),
  unique (user_id, batch_id, row_number),
  unique (user_id, fingerprint)
);

create table public.categorization_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  match_text text not null check (char_length(trim(match_text)) between 1 and 120),
  transaction_type text check (transaction_type in ('income', 'expense')),
  category_id uuid not null,
  priority integer not null default 100 check (priority between 1 and 9999),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (user_id, category_id) references public.categories(user_id, id) on delete restrict
);

create index if not exists import_batches_user_status_idx on public.import_batches (user_id, status, created_at desc);
create index if not exists import_rows_batch_status_idx on public.import_rows (user_id, batch_id, status, row_number);
create index if not exists categorization_rules_user_priority_idx on public.categorization_rules (user_id, is_active, priority);

alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.categorization_rules enable row level security;
alter table public.import_batches force row level security;
alter table public.import_rows force row level security;
alter table public.categorization_rules force row level security;

create policy "import_batches_select_own" on public.import_batches for select to authenticated using ((select auth.uid()) = user_id);
create policy "import_batches_insert_own" on public.import_batches for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "import_batches_update_own" on public.import_batches for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "import_rows_select_own" on public.import_rows for select to authenticated using ((select auth.uid()) = user_id);
create policy "import_rows_insert_own" on public.import_rows for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "import_rows_update_own" on public.import_rows for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categorization_rules_select_own" on public.categorization_rules for select to authenticated using ((select auth.uid()) = user_id);
create policy "categorization_rules_insert_own" on public.categorization_rules for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categorization_rules_update_own" on public.categorization_rules for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.import_batches, public.import_rows, public.categorization_rules from anon, authenticated;
grant select, insert, update on public.import_batches, public.import_rows, public.categorization_rules to authenticated;

create or replace function public.confirm_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_batch public.import_batches%rowtype;
  v_row public.import_rows%rowtype;
  v_account public.financial_accounts%rowtype;
  v_transaction_id uuid;
  v_imported integer := 0;
  v_duplicates integer := 0;
  v_invalid integer := 0;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  select * into v_batch from public.import_batches where id = p_batch_id and user_id = v_user_id for update;
  if not found then raise exception 'import_batch_not_found'; end if;
  if v_batch.status <> 'preview' then raise exception 'import_batch_not_in_preview'; end if;
  select * into v_account from public.financial_accounts where id = v_batch.account_id and user_id = v_user_id and is_active;
  if not found then raise exception 'import_account_not_active'; end if;

  for v_row in select * from public.import_rows where user_id = v_user_id and batch_id = p_batch_id order by row_number for update loop
    if v_row.status <> 'ready' or v_row.effective_date is null or v_row.description is null or v_row.amount is null or v_row.fingerprint is null then
      update public.import_rows set status = 'invalid', error_message = coalesce(error_message, 'Fila incompleta') where id = v_row.id;
      v_invalid := v_invalid + 1;
    elsif exists (select 1 from public.ledger_transactions where user_id = v_user_id and import_fingerprint = v_row.fingerprint) then
      update public.import_rows set status = 'duplicate', error_message = 'Movimiento ya importado' where id = v_row.id;
      v_duplicates := v_duplicates + 1;
    else
      insert into public.ledger_transactions(id, user_id, effective_date, description, transaction_type, category_id, import_row_id, import_fingerprint)
      values (gen_random_uuid(), v_user_id, v_row.effective_date, trim(v_row.description), v_row.transaction_type, v_row.category_id, v_row.id, v_row.fingerprint)
      returning id into v_transaction_id;
      insert into public.ledger_entries(user_id, transaction_id, account_id, entry_kind, currency_code, amount)
      values
        (v_user_id, v_transaction_id, v_account.id, 'account', v_account.currency_code, case when v_row.transaction_type = 'expense' then -abs(v_row.amount) else abs(v_row.amount) end),
        (v_user_id, v_transaction_id, null, 'external', v_account.currency_code, case when v_row.transaction_type = 'expense' then abs(v_row.amount) else -abs(v_row.amount) end);
      update public.import_rows set status = 'imported', created_transaction_id = v_transaction_id where id = v_row.id;
      v_imported := v_imported + 1;
    end if;
  end loop;

  update public.import_batches
  set status = 'confirmed', confirmed_at = now()
  where id = p_batch_id and user_id = v_user_id;

  return jsonb_build_object('imported', v_imported, 'duplicates', v_duplicates, 'invalid', v_invalid);
end;
$$;

revoke execute on function public.confirm_import_batch(uuid) from public, anon;
grant execute on function public.confirm_import_batch(uuid) to authenticated;
