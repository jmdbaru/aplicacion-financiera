-- Índices de soporte para claves foráneas y operaciones de reverso.
create index ledger_entries_transaction_idx
on public.ledger_entries (user_id, transaction_id);

create index ledger_transactions_user_reversal_idx
on public.ledger_transactions (user_id, reversed_transaction_id)
where reversed_transaction_id is not null;
