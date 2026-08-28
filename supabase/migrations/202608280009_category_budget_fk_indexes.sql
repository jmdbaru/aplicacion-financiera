-- Índices de cobertura para las claves foráneas añadidas en la Fase 4.
create index categories_parent_id_idx
  on public.categories (parent_id)
  where parent_id is not null;

create index budgets_category_id_idx
  on public.budgets (category_id);

create index ledger_transactions_category_id_idx
  on public.ledger_transactions (category_id)
  where category_id is not null;
