# Flujo de aplicación — Aplicación Financiera

Actualizado: 2026-09-08 · Fuente: código y migraciones locales · Leyenda: `VERIFICADO` = comprobación ejecutada en este cierre; `INFERIDO` = revisado en código; `BLOQUEADO` = requiere entorno o acción externa.

```mermaid
flowchart TD
  Visitor[Visitante] --> Auth[AuthPanel: acceso, alta y recuperación]
  Auth -->|JWT y sesión| SupabaseAuth[(Supabase Auth)]
  SupabaseAuth -->|sesión válida| Shell[FinanceWorkspace]
  Shell --> Summary[Inicio y dashboard]
  Shell --> Transactions[Movimientos: alta, búsqueda y reverso]
  Shell --> Accounts[Cuentas]
  Shell --> Planning[Planificación]
  Planning --> Categories[Categorías y subcategorías]
  Planning --> Budgets[Presupuestos]
  Planning --> Recurring[Recurrentes y calendario]
  Planning --> Goals[Objetivos y aportaciones]
  Shell --> Reports[Informes y CSV]
  Shell --> Splits[Repartos]
  Shell -. preparados, no expuestos en navegación .-> Imports[Importación y reglas]
  Shell -. preparados, no expuestos en navegación .-> Wealth[Patrimonio]
  Shell -. preparados, no expuestos en navegación .-> Investments[Inversiones]

  Transactions -->|RPC atómica| Ledger[(Ledger)]
  Budgets -->|RPC agregada| Database[(PostgreSQL + RLS)]
  Goals -->|aportaciones| Database
  Reports -->|get_reports_overview| Database
  Imports -->|staging + confirmación| Ledger
  Shell -->|API v1 cuando aplica| API[FastAPI]
  API -->|JWT del usuario| Database
  SupabaseAuth --> Database

  Database --> Errors[Estados de carga, vacío, error y recuperación]
  Errors --> Shell
```

## Límites y recuperación

- `VERIFICADO`: pantalla de acceso, servidor Vite y health de FastAPI en localhost; no hay errores ni avisos de consola en la pantalla pública.
- `INFERIDO`: las operaciones financieras críticas se dirigen a RPC y las consultas a funciones `SECURITY INVOKER` según las migraciones locales.
- `BLOQUEADO`: los flujos autenticados, la persistencia y el aislamiento entre dos usuarios no pueden declararse verificados sin una sesión de prueba y un Supabase con las migraciones actuales aplicadas.

