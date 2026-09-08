# Diagrama de base de datos — Aplicación Financiera

Actualizado: 2026-09-08 · Versión local: migraciones hasta `20260908110200`.

Todas las tablas privadas referenciadas en el diagrama usan `user_id`, RLS y políticas de propietario según las migraciones. Los catálogos solo permiten lectura autenticada. No se incluyen secretos ni datos personales.

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : owns
  AUTH_USERS ||--o{ FINANCIAL_ACCOUNTS : owns
  AUTH_USERS ||--o{ LEDGER_TRANSACTIONS : owns
  FINANCIAL_ACCOUNTS ||--o{ LEDGER_ENTRIES : receives
  LEDGER_TRANSACTIONS ||--|{ LEDGER_ENTRIES : contains
  AUTH_USERS ||--o{ CATEGORIES : owns
  CATEGORIES ||--o{ CATEGORIES : parent_id
  CATEGORIES ||--o{ BUDGETS : budgets
  CATEGORIES ||--o{ LEDGER_TRANSACTIONS : classifies
  BUDGET_TIME_PERIODS ||--o{ BUDGETS : defines
  AUTH_USERS ||--o{ RECURRING_RULES : owns
  RECURRING_RULES ||--o{ RECURRING_OCCURRENCES : generates
  AUTH_USERS ||--o{ SAVINGS_GOALS : owns
  SAVINGS_GOALS ||--o{ GOAL_CONTRIBUTIONS : receives
  AUTH_USERS ||--o{ WEALTH_ITEMS : owns
  WEALTH_ITEMS ||--o{ WEALTH_VALUATIONS : values
  AUTH_USERS ||--o{ IMPORT_BATCHES : owns
  IMPORT_BATCHES ||--o{ IMPORT_ROWS : stages
  AUTH_USERS ||--o{ CATEGORIZATION_RULES : owns
  AUTH_USERS ||--o{ INVESTMENT_PORTFOLIOS : owns
  INVESTMENT_PORTFOLIOS ||--o{ INVESTMENT_OPERATIONS : records
  INVESTMENT_INSTRUMENTS ||--o{ INVESTMENT_OPERATIONS : identifies
  INVESTMENT_PORTFOLIOS ||--o{ INVESTMENT_VALUATIONS : values
  AUTH_USERS ||--o{ SPLIT_EVENTS : owns
  SPLIT_EVENTS ||--o{ SPLIT_PARTICIPANTS : has
  SPLIT_EVENTS ||--o{ SPLIT_EXPENSES : has
  SPLIT_EXPENSES ||--o{ SPLIT_EXPENSE_PARTICIPANTS : allocates
  SPLIT_EVENTS ||--o{ SPLIT_SETTLEMENTS : settles
  AUTH_USERS ||--o{ TRANSACTION_LIBRARY_ITEMS : owns

  PROFILES { uuid user_id PK "RLS forced" }
  FINANCIAL_ACCOUNTS { uuid id PK uuid user_id FK text currency_code }
  LEDGER_TRANSACTIONS { uuid id PK uuid user_id FK date effective_date text transaction_type uuid category_id }
  LEDGER_ENTRIES { uuid id PK uuid transaction_id FK uuid account_id FK numeric amount }
  CATEGORIES { uuid id PK uuid user_id FK uuid parent_id text type boolean is_active }
  BUDGETS { uuid id PK uuid user_id FK uuid category_id FK date period_start smallint time_period_id }
  SAVINGS_GOALS { uuid id PK uuid user_id FK numeric target_amount text status text priority }
  GOAL_CONTRIBUTIONS { uuid id PK uuid goal_id FK numeric amount date contributed_on }
  IMPORT_BATCHES { uuid id PK uuid user_id FK text status }
  INVESTMENT_PORTFOLIOS { uuid id PK uuid user_id FK uuid cash_account_id }
  SPLIT_EVENTS { uuid id PK uuid user_id FK }
}
```

## Funciones e invariantes relevantes

- `create_ledger_transaction` y `reverse_ledger_transaction`: escritura atómica del ledger.
- `search_ledger_transactions`, `get_dashboard_overview`, `get_budget_overview`, `get_reports_overview`, `get_savings_goals_overview`, `get_wealth_overview` y `get_investments_overview`: lectura agregada con `SECURITY INVOKER`.
- `confirm_import_batch`: staging, validación y deduplicación antes de crear movimientos.
- `INFERIDO`: la nueva migración de informes conserva categoría raíz y subcategoría; la de objetivos añade prioridad, periodicidad y pausa. Ambas requieren aplicarse en Supabase antes de ser efectivas fuera del entorno local.
