-- Índices que respaldan claves foráneas y los filtros usados por RLS.
create index if not exists categorization_rules_user_category_idx on public.categorization_rules(user_id, category_id);
create index if not exists import_batches_user_account_idx on public.import_batches(user_id, account_id);
create index if not exists import_rows_user_category_idx on public.import_rows(user_id, category_id);
create index if not exists investment_operations_user_instrument_idx on public.investment_operations(user_id, instrument_id);
create index if not exists investment_portfolios_user_cash_account_idx on public.investment_portfolios(user_id, cash_account_id);
create index if not exists recurring_occurrences_user_rule_idx on public.recurring_occurrences(user_id, rule_id);
create index if not exists recurring_occurrences_user_transaction_idx on public.recurring_occurrences(user_id, transaction_id);
create index if not exists recurring_rules_category_idx on public.recurring_rules(category_id);
create index if not exists recurring_rules_user_account_idx on public.recurring_rules(user_id, account_id);
create index if not exists recurring_rules_user_destination_idx on public.recurring_rules(user_id, destination_account_id);
create index if not exists split_events_user_idx on public.split_events(user_id);
create index if not exists split_expense_participants_participant_idx on public.split_expense_participants(participant_id);
create index if not exists split_expenses_event_idx on public.split_expenses(event_id);
create index if not exists split_expenses_payer_idx on public.split_expenses(payer_id);
create index if not exists split_expenses_user_idx on public.split_expenses(user_id);
create index if not exists split_participants_user_idx on public.split_participants(user_id);
create index if not exists split_settlements_payer_idx on public.split_settlements(payer_id);
create index if not exists split_settlements_recipient_idx on public.split_settlements(recipient_id);
create index if not exists split_settlements_user_idx on public.split_settlements(user_id);
create index if not exists transaction_library_category_idx on public.transaction_library_items(category_id);

-- Impide relaciones cruzadas entre eventos, incluso dentro de la cuenta del mismo usuario.
drop policy if exists split_expenses_own on public.split_expenses;
create policy split_expenses_own on public.split_expenses for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.split_events e where e.id = event_id and e.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.split_events e where e.id = event_id and e.user_id = (select auth.uid()))
    and exists (select 1 from public.split_participants p where p.id = payer_id and p.event_id = event_id and p.user_id = (select auth.uid()))
  );

drop policy if exists split_expense_participants_own on public.split_expense_participants;
create policy split_expense_participants_own on public.split_expense_participants for all to authenticated
  using (
    exists (
      select 1 from public.split_expenses x
      join public.split_participants p on p.id = participant_id and p.event_id = x.event_id and p.user_id = x.user_id
      where x.id = expense_id and x.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.split_expenses x
      join public.split_participants p on p.id = participant_id and p.event_id = x.event_id and p.user_id = x.user_id
      where x.id = expense_id and x.user_id = (select auth.uid())
    )
  );

drop policy if exists split_settlements_own on public.split_settlements;
create policy split_settlements_own on public.split_settlements for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.split_events e where e.id = event_id and e.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.split_events e where e.id = event_id and e.user_id = (select auth.uid()))
    and exists (select 1 from public.split_participants p where p.id = payer_id and p.event_id = event_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.split_participants p where p.id = recipient_id and p.event_id = event_id and p.user_id = (select auth.uid()))
  );
