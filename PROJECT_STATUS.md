# Estado del proyecto

- Fase actual: Fase 13 — Cierre de desarrollo, `LISTO CON PENDIENTES`.
- Última fase aprobada: Fase 6 — Recurrentes y calendario.
- Estado: experiencia principal simplificada, layout de escritorio ajustado al viewport, base de datos endurecida y validación automática correcta.
- Actualización: 2026-09-08.
- Pendientes centralizados: `PENDIENTES_PROYECTO.md`.

## Stack objetivo

React 19/TypeScript 5.9/Vite 7/Tailwind 4; FastAPI/Pydantic/Uvicorn; Supabase PostgreSQL/Auth/RLS. Detectados: Python 3.12.10 y Git 2.53.0. Node no está instalado globalmente; las comprobaciones web se ejecutan con el runtime aislado y en CI con Node 24.

## Comandos

- API (en un entorno con dependencias): `python -m pip install -e ".[dev]"`, `pytest`, `ruff check .`.
- Web (Node 24.19.0): `npm ci`, `npm run check`, `npm run build`.
- Validación remota: GitHub Actions ejecuta ambos jobs en cada push a `main`.

## Terminado

Auditoría; arquitectura; modelo e invariantes; estrategia RLS; pruebas/mantenimiento/entornos/despliegue; documentación viva y ADR.

Base FastAPI y frontend React/Vite/Tailwind operativos. Supabase Auth, perfiles, cuentas, ledger, categorías y presupuestos están protegidos por RLS. La consolidación prioriza el alta rápida de movimientos, reduce la densidad mediante vistas progresivas y mantiene el documento fijo en escritorio: los listados administran su propio scroll sin imponer una barra visible. Inicio usa carrusel, Movimientos incorpora navegación semanal y alturas estables, Cuentas filtra por píldoras, el alta admite plantillas, Objetivos separa activos y completados y puede seguir aportaciones o el saldo real de una cuenta, Calendario resume el balance diario y Repartos navega al historial sin modal. Presupuestos admite límites recurrentes por ciclo con vigencia opcional. Configuración permite combinar el color de acento con cuatro estilos completos de espacio. Última validación local: Ruff correcto, 31 pruebas API, lint y TypeScript correctos, 17 pruebas web y build de producción correcto.

## Bloqueos y acciones

Supabase contiene las migraciones funcionales anteriores y las correcciones de cierre `20260908110000_reports_periods_and_category_hierarchy.sql`, `20260908110100_goal_planning_controls.sql`, `20260908110200_restore_budget_period_helper_execute.sql` y `20260908120000_budget_recurrence_and_goal_tracking.sql`, aplicadas y verificadas el 2026-09-08. La última añade vigencia de límites recurrentes y seguimiento de objetivos con el saldo de una cuenta; los permisos de ambos RPC se verificaron para `authenticated`. Las 31 versiones locales y remotas quedaron reconciliadas sin reejecutar DDL pendiente. Se añadieron índices de respaldo para claves foráneas, validación de pertenencia al mismo evento en repartos y búsqueda paginada de movimientos con `SECURITY INVOKER`. RLS, atomicidad, reversos, jerarquía, archivo y aislamiento entre usuarios siguen vigentes por revisión de migraciones, pero requieren repetición con dos usuarios. El asesor no tiene errores y conserva 34 avisos de exposición GraphQL que requieren una decisión de arquitectura; los pendientes de Auth y Excel `.xlsx` siguen registrados. Git usa `origin/main`.

## Fase en curso

Fase 13: cierre responsable. Se han verificado lint, tipos, 20 pruebas web, build, Ruff y 31 pruebas API, además de localhost público y health API. En una sesión autenticada se han comprobado sin escritura Informes (Día/Semana/Mes/Año/rango personalizado) y el formulario de Objetivos (estados, prioridad y frecuencia). Las dos correcciones se aplicaron en Supabase con esquema y privilegios verificados. Quedan las mutaciones controladas, la reconciliación del historial, la decisión de GraphQL y el endurecimiento de Auth antes de producción.

## Referencias

- `docs/phases/phase-00-audit-and-foundations.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/security.md`
- `docs/phases/phase-03-financial-core.md`
- `docs/phases/phase-04-categories-and-budgets.md`
- `docs/phases/phase-07-savings-goals.md`
- `docs/phases/phase-08-wealth.md`
- `docs/phases/phase-09-reports.md`
- `docs/phases/phase-10-imports-and-rules.md`
- `docs/phases/phase-11-investments.md`
- `docs/phases/phase-12-product-consolidation.md`
- `docs/phases/phase-13-development-closure.md`
