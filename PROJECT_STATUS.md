# Estado del proyecto

- Fase actual: Fase 6 — Recurrentes y calendario, finalizada técnicamente y en revisión.
- Última fase aprobada: Fase 5 — Dashboard y resumen financiero.
- Estado: la Fase 5 fue aprobada por autorización expresa; la Fase 6 está pendiente de comprobaciones finales y validación funcional.
- Actualización: 2026-08-28.

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

Supabase contiene las migraciones de perfiles, cuentas, ledger, categorías, presupuestos y dashboard aplicadas. RLS, atomicidad, reversos, jerarquía, archivo y aislamiento entre usuarios fueron comprobados. Los pendientes previos a producción de Auth siguen registrados. La ausencia de Node global no bloquea el runtime aislado ni la CI remota. Git usa `origin/main`.

## Fase en curso

Fase 5: dashboard y resumen financiero. La siguiente fase no se iniciará hasta que esta quede finalizada y autorizada.

## Referencias

- `docs/phases/phase-00-audit-and-foundations.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/security.md`
- `docs/phases/phase-03-financial-core.md`
- `docs/phases/phase-04-categories-and-budgets.md`
