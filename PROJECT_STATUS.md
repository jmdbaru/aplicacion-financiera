# Estado del proyecto

- Fase actual: Fase 2 — Supabase, autenticación y seguridad multiusuario.
- Última fase aprobada: Fase 1 — Fundaciones técnicas y experiencia base.
- Estado: Fase 2 en curso; Supabase, migraciones base y aislamiento RLS verificados.
- Actualización: 2026-08-27.

## Stack objetivo

React/TypeScript/Vite/Tailwind; FastAPI/Pydantic/Uvicorn; Supabase PostgreSQL/Auth/RLS. Versiones aún no fijadas. Detectados: Python 3.12.10 y Git 2.53.0; Node/npm ausentes.

## Comandos

- API (en un entorno con dependencias): `python -m pip install -e ".[dev]"`, `pytest`, `ruff check .`.
- Web (Node 24.19.0): `npm ci`, `npm run check`, `npm run build`.
- Validación remota: GitHub Actions ejecuta ambos jobs en cada push a `main`.

## Terminado

Auditoría; arquitectura; modelo e invariantes; estrategia RLS; pruebas/mantenimiento/entornos/despliegue; documentación viva y ADR.

Base de API FastAPI: configuración segura, CORS explícito, contratos de error, health check, correlación de peticiones y tests. Frontend React/Vite/Tailwind: shell responsive, tokens visuales, accesibilidad y prueba de componente. CI remoto validado en `v1.005` con instalaciones deterministas: Ruff correcto, 3 pruebas API correctas, y job web con `npm ci`, lint, tests, tipos y build correctos. La sintaxis Python también fue validada localmente con `compileall`.

## Bloqueos y acciones

Supabase está activo y contiene las migraciones de perfiles aplicadas. RLS y políticas de `profiles` fueron verificadas, incluida una matriz de dos usuarios: no hay lectura ni actualización horizontal y se mantiene la edición del propio perfil. La integración real de sesión sigue pendiente. Node/npm no pueden instalarse en este equipo, pero no bloquean la CI remota. Git está conectado a `origin` en GitHub, rama `main`. Véase `USER_ACTIONS.md`.

## Siguiente fase propuesta (no iniciada)

Completar Fase 2: pruebas RLS con dos usuarios, sesión/rutas protegidas e integración de Auth.

## Referencias

- `docs/phases/phase-00-audit-and-foundations.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/security.md`
