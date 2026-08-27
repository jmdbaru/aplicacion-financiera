# Modelo lógico inicial

## Convenciones

PostgreSQL/Supabase; claves UUID, importes `numeric(20,4)`, monedas ISO 4217 `char(3)`, instantes `timestamptz` UTC y fechas contables `date`. Las tablas privadas incluyen `user_id`, auditoría e índices alineados con RLS. El histórico se archiva cuando corresponde.

## Relaciones propuestas

```text
auth.users 1--1 profiles
profiles 1--N financial_accounts
profiles 1--N categories (parent_id opcional)
profiles 1--N ledger_transactions 1--N ledger_entries N--1 financial_accounts
categories 1--N ledger_transactions
profiles 1--N budgets N--1 categories
profiles 1--N recurring_rules
profiles 1--N savings_goals 1--N goal_contributions
profiles 1--N assets / liabilities 1--N valuations
profiles 1--N import_jobs 1--N import_rows
profiles 1--N categorization_rules
profiles 1--N portfolios 1--N investment_transactions
```

Las relaciones se implementan por fase; este diseño no autoriza crear todas las tablas anticipadamente.

## Invariantes

- Cada transacción contabilizada tiene al menos dos entradas y suma cero por moneda.
- Una transferencia usa entradas compensadas y no es ingreso ni gasto.
- Cabecera, entradas y reversos se escriben atómicamente.
- Una operación contabilizada se corrige mediante anulación/reverso trazable.
- Todos los objetos relacionados pertenecen al mismo usuario y la base lo comprueba.
- Presupuesto único por usuario, categoría, moneda y periodo.
- Progreso de objetivo derivado de aportaciones.
- Patrimonio neto = activos - pasivos para la fecha de valoración.
- Importaciones pasan por staging, validación y confirmación.

## Índices previstos

- Tablas privadas: `(user_id, id)` y variantes justificadas por estado/fecha.
- Entradas: `(user_id, account_id, effective_date desc)`.
- Transacciones: `(user_id, effective_date desc, id)`.
- Presupuesto único: `(user_id, category_id, period_start, currency_code)`.
- Huella de importación acotada por usuario/origen.

Se confirmarán con consultas y `EXPLAIN`, evitando índices decorativos.

## Migraciones y recuperación

Migraciones ordenadas en `supabase/migrations/`, cambios compatibles y estrategia expand/contract con datos reales. Cada fase documentará rollback; cambios destructivos exigirán copia y restauración ensayada. Seeds solo ficticios.

