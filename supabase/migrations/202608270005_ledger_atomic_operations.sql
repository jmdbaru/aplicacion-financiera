-- Operaciones atómicas del ledger. La identidad siempre procede de auth.uid().
create unique index ledger_single_reversal_idx
on public.ledger_transactions (reversed_transaction_id)
where reversed_transaction_id is not null;

create or replace function public.create_ledger_transaction(
  p_effective_date date,
  p_description text,
  p_transaction_type text,
  p_entries jsonb
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

  insert into public.ledger_transactions(id,user_id,effective_date,description,transaction_type)
  values(v_transaction_id,v_user_id,p_effective_date,trim(p_description),p_transaction_type);
  insert into public.ledger_entries(user_id,transaction_id,account_id,entry_kind,currency_code,amount)
  select v_user_id,v_transaction_id,e.account_id,e.entry_kind,e.currency_code,e.amount
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
  insert into public.ledger_transactions(id,user_id,effective_date,description,transaction_type,reversed_transaction_id)
  values(v_reversal_id,v_user_id,p_effective_date,coalesce(nullif(trim(p_description),''),'Reverso: '||v_original.description),'reversal',p_transaction_id);
  insert into public.ledger_entries(user_id,transaction_id,account_id,entry_kind,currency_code,amount)
  select user_id,v_reversal_id,account_id,entry_kind,currency_code,-amount from public.ledger_entries where transaction_id=p_transaction_id and user_id=v_user_id;
  return v_reversal_id;
end;
$$;

revoke execute on function public.create_ledger_transaction(date,text,text,jsonb) from public, anon;
revoke execute on function public.reverse_ledger_transaction(uuid,date,text) from public, anon;
grant execute on function public.create_ledger_transaction(date,text,text,jsonb) to authenticated;
grant execute on function public.reverse_ledger_transaction(uuid,date,text) to authenticated;
