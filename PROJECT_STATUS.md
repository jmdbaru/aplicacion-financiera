# Estado del proyecto

- Fase actual: Fase 12 — Consolidación de producto, finalizada técnicamente y en revisión funcional.
- Última fase aprobada: Fase 6 — Recurrentes y calendario.
- Estado: experiencia principal simplificada, base de datos endurecida y validación automática correcta.
- Actualización: 2026-09-02.

## Stack objetivo

React 19/TypeScript 5.9/Vite 7/Tailwind 4; FastAPI/Pydantic/Uvicorn; Supabase PostgreSQL/Auth/RLS. Detectados: Python 3.12.10 y Git 2.53.0. Node no está instalado globalmente; las comprobaciones web se ejecutan con el runtime aislado y en CI con Node 24.

## Comandos

- API (en un entorno con dependencias): `python -m pip install -e ".[dev]"`, `pytest`, `ruff check .`.
- Web (Node 24.19.0): `npm ci`, `npm run check`, `npm run build`.
- Validación remota: GitHub Actions ejecuta ambos jobs en cada push a `main`.

## Terminado

Auditoría; arquitectura; modelo e invariantes; estrategia RLS; pruebas/mantenimiento/entornos/despliegue; documentación viva y ADR.

Base FastAPI y frontend React/Vite/Tailwind operativos. Supabase Auth, perfiles, cuentas, ledger, categorías y presupuestos están protegidos por RLS. La consolidación prioriza el alta rápida de movimientos, reduce la densidad de cuentas, objetivos y repartos mediante vistas progresivas, y mueve los filtros de movimientos a una consulta paginada en servidor. Última validación local: Ruff correcto, 31 pruebas API, lint y TypeScript correctos, 17 pruebas web y build de producción correcto.

## Bloqueos y acciones

Supabase contiene todas las migraciones funcionales y las dos migraciones de consolidación aplicadas. Se añadieron índices de respaldo para claves foráneas, validación de pertenencia al mismo evento en repartos y búsqueda paginada de movimientos con `SECURITY INVOKER`. RLS, atomicidad, reversos, jerarquía, archivo y aislamiento entre usuarios siguen vigentes. Los pendientes previos a producción de Auth, GraphQL y Excel `.xlsx` siguen registrados. La ausencia de Node global no bloquea el runtime aislado ni la CI remota. Git usa `origin/main`.

## Fase en curso

Fase 12: consolidación de producto. Queda pendiente la validación funcional del usuario antes de ampliar nuevos dominios.

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
