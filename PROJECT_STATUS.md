# Estado del proyecto

- Fase actual: Fase 11 — Inversiones, finalizada técnicamente y en revisión funcional.
- Última fase aprobada: Fase 6 — Recurrentes y calendario.
- Estado: la Fase 11 está pendiente de validación funcional en la vista previa.
- Actualización: 2026-08-31.

## Stack objetivo

React 19/TypeScript 5.9/Vite 7/Tailwind 4; FastAPI/Pydantic/Uvicorn; Supabase PostgreSQL/Auth/RLS. Detectados: Python 3.12.10 y Git 2.53.0. Node no está instalado globalmente; las comprobaciones web se ejecutan con el runtime aislado y en CI con Node 24.

## Comandos

- API (en un entorno con dependencias): `python -m pip install -e ".[dev]"`, `pytest`, `ruff check .`.
- Web (Node 24.19.0): `npm ci`, `npm run check`, `npm run build`.
- Validación remota: GitHub Actions ejecuta ambos jobs en cada push a `main`.

## Terminado

Auditoría; arquitectura; modelo e invariantes; estrategia RLS; pruebas/mantenimiento/entornos/despliegue; documentación viva y ADR.

Base FastAPI y frontend React/Vite/Tailwind operativos. Supabase Auth, perfiles, cuentas, ledger, categorías y presupuestos están protegidos por RLS. La Fase 4 añade catálogo global conservado, categorías personales/subcategorías, presupuestos mensuales, alertas, comparación mensual y categorización opcional de ingresos y gastos. Última validación: Ruff correcto, 17 pruebas API correctas, lint y TypeScript correctos, 6 pruebas web correctas, build correcto, y GitHub Actions/Pages correctos en `v1.027`.

## Bloqueos y acciones

Supabase contiene las migraciones de perfiles, cuentas, ledger, categorías, presupuestos, dashboard, objetivos, patrimonio, informes, importación e inversiones aplicadas. RLS, atomicidad, reversos, jerarquía, archivo y aislamiento entre usuarios fueron comprobados en fases previas. Los pendientes previos a producción de Auth, GraphQL, Excel `.xlsx` e historial remoto de migraciones siguen registrados. La ausencia de Node global no bloquea el runtime aislado ni la CI remota. Git usa `origin/main`.

## Fase en curso

Fase 11: inversiones. La siguiente fase no se iniciará hasta que esta quede validada y autorizada.

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
