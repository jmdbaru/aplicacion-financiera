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

## Implementado en la Fase 3

`financial_accounts`, `ledger_transactions` y `ledger_entries` están creadas y protegidas por RLS forzada. Las cuentas admiten archivo reversible. Los saldos se calculan agregando entradas y no se almacenan como una columna mutable.

Las RPC `create_ledger_transaction` y `reverse_ledger_transaction` concentran la escritura atómica. Validan `auth.uid()`, propiedad, estado de las cuentas, moneda, importes, suma cero y trazabilidad del reverso. Los clientes autenticados pueden leer únicamente sus filas mediante RLS y no pueden insertar, actualizar ni borrar directamente el ledger.

## Implementado en la Fase 4

`categories` conserva el catálogo global y añade categorías personales, una subcategoría como máximo, archivo reversible y políticas RLS explícitas. `budgets` es privado por usuario y usa una restricción única por categoría raíz, periodo mensual y moneda. Las categorías globales son visibles pero inmutables; las personales solo pueden modificarse por su propietario.

`ledger_transactions.category_id` es opcional y se valida en la RPC de creación. Solo se acepta en ingresos y gastos, con una categoría activa y visible para el usuario. `get_budget_overview` agrega los gastos por categoría raíz, separa gasto fuera de presupuesto y compensa reversos en el mes de su fecha contable.

## Implementado en la Fase 5

`get_dashboard_overview(period_start, currency_code)` devuelve un único documento agregado y limitado al usuario autenticado: disponible de cuentas activas, ingresos, gastos, balance, presupuesto, seis meses de evolución y cinco movimientos recientes. Es `SECURITY INVOKER`, valida el periodo/moneda y hereda RLS; no almacena saldos ni materializa datos de otros usuarios.

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

En la Fase 3 se añadieron índices por usuario/fecha, cuenta/fecha y claves foráneas de transacción y reverso. El asesor remoto ya no informa claves foráneas sin índice. El índice por cuenta/fecha aparece todavía como no usado porque no existe carga representativa; se medirá antes de decidir retirarlo.

## Migraciones y recuperación

Migraciones ordenadas en `supabase/migrations/`, cambios compatibles y estrategia expand/contract con datos reales. Cada fase documentará rollback; cambios destructivos exigirán copia y restauración ensayada. Seeds solo ficticios.
