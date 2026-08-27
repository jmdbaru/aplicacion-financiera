# Estado del proyecto

- Fase actual: Fase 4 — Categorías y presupuestos.
- Última fase aprobada: Fase 3 — Núcleo financiero: cuentas y ledger.
- Estado: Fase 3 aprobada tras la validación funcional del usuario; Fase 4 en curso.
- Actualización: 2026-08-27.

## Stack objetivo

React 19/TypeScript 5.9/Vite 7/Tailwind 4; FastAPI/Pydantic/Uvicorn; Supabase PostgreSQL/Auth/RLS. Detectados: Python 3.12.10 y Git 2.53.0. Node no está instalado globalmente; las comprobaciones web se ejecutan con el runtime aislado y en CI con Node 24.

## Comandos

- API (en un entorno con dependencias): `python -m pip install -e ".[dev]"`, `pytest`, `ruff check .`.
- Web (Node 24.19.0): `npm ci`, `npm run check`, `npm run build`.
- Validación remota: GitHub Actions ejecuta ambos jobs en cada push a `main`.

## Terminado

Auditoría; arquitectura; modelo e invariantes; estrategia RLS; pruebas/mantenimiento/entornos/despliegue; documentación viva y ADR.

Base FastAPI y frontend React/Vite/Tailwind operativos. Supabase Auth, perfiles y preferencias protegidos por RLS. La Fase 3 añade cuentas financieras privadas, saldos derivados, ledger de doble partida, ingresos, gastos, ajustes, transferencias y reversos atómicos, listados paginados con filtros y una interfaz responsive completa. Última validación local: Ruff correcto, 12 pruebas API correctas, lint web correcto, 3 pruebas web correctas y build correcto. GitHub Actions y GitHub Pages finalizaron correctamente en `v1.025`.

## Bloqueos y acciones

Supabase contiene las migraciones de perfiles, cuentas y ledger aplicadas. RLS, atomicidad, descuadres, transferencia y reverso fueron comprobados. Los pendientes previos a producción de Auth siguen registrados. La ausencia de Node global no bloquea el runtime aislado ni la CI remota. Git usa `origin/main`.

## Siguiente fase propuesta (no iniciada)

Fase 4: adaptar las categorías existentes e implementar presupuestos mensuales, agregaciones y alertas.

## Referencias

- `docs/phases/phase-00-audit-and-foundations.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/security.md`
- `docs/phases/phase-03-financial-core.md`
