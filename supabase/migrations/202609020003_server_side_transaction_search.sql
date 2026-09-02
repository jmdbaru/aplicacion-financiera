create or replace function public.search_ledger_transactions(
  p_page integer default 0,
  p_page_size integer default 10,
  p_search text default null,
  p_date_from date default null,
  p_date_to date default null,
  p_transaction_type text default null,
  p_category_id uuid default null,
  p_subcategory_id uuid default null,
  p_currency_code text default null,
  p_account_id uuid default null
)
returns table(row_data jsonb, total_count bigint)
language sql
security invoker
set search_path = public, pg_temp
as $$
  select
    jsonb_build_object(
      'id', t.id,
      'effective_date', t.effective_date,
      'description', t.description,
      'transaction_type', t.transaction_type,
      'category_id', t.category_id,
      'reversed_transaction_id', t.reversed_transaction_id,
      'ledger_entries', coalesce((
        select jsonb_agg(jsonb_build_object(
          'account_id', e.account_id,
          'entry_kind', e.entry_kind,
          'currency_code', e.currency_code,
          'amount', e.amount
        ) order by e.created_at, e.id)
        from public.ledger_entries e
        where e.transaction_id = t.id and e.user_id = (select auth.uid())
      ), '[]'::jsonb)
    ) as row_data,
    count(*) over() as total_count
  from public.ledger_transactions t
  where t.user_id = (select auth.uid())
    and (p_search is null or trim(p_search) = '' or t.description ilike '%' || replace(replace(trim(p_search), '%', '\%'), '_', '\_') || '%' escape '\')
    and (p_date_from is null or t.effective_date >= p_date_from)
    and (p_date_to is null or t.effective_date <= p_date_to)
    and (p_transaction_type is null or t.transaction_type = p_transaction_type)
    and (p_subcategory_id is null or t.category_id = p_subcategory_id)
    and (p_category_id is null or t.category_id = p_category_id or exists (
      select 1 from public.categories c where c.id = t.category_id and c.parent_id = p_category_id
    ))
    and (p_currency_code is null or exists (
      select 1 from public.ledger_entries e
      where e.transaction_id = t.id and e.user_id = (select auth.uid()) and e.entry_kind = 'account' and e.currency_code = p_currency_code
    ))
    and (p_account_id is null or exists (
      select 1 from public.ledger_entries e
      where e.transaction_id = t.id and e.user_id = (select auth.uid()) and e.entry_kind = 'account' and e.account_id = p_account_id
    ))
  order by t.effective_date desc, t.id desc
  offset greatest(p_page, 0) * least(greatest(p_page_size, 1), 100)
  limit least(greatest(p_page_size, 1), 100);
$$;

revoke all on function public.search_ledger_transactions(integer,integer,text,date,date,text,uuid,uuid,text,uuid) from public, anon;
grant execute on function public.search_ledger_transactions(integer,integer,text,date,date,text,uuid,uuid,text,uuid) to authenticated;
