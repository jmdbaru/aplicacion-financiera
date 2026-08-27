# Estado del proyecto

- Fase actual: Fase 1 — Fundaciones técnicas y experiencia base.
- Última fase aprobada: Fase 0 — Auditoría, definición y base.
- Estado: bloqueada antes de implementar por ausencia de Node/npm.
- Actualización: 2026-08-27.

## Stack objetivo

React/TypeScript/Vite/Tailwind; FastAPI/Pydantic/Uvicorn; Supabase PostgreSQL/Auth/RLS. Versiones aún no fijadas. Detectados: Python 3.12.10 y Git 2.53.0; Node/npm ausentes.

## Comandos

Todavía no existen comandos de instalación, desarrollo, pruebas o build: la Fase 1 está autorizada, pero no puede comenzar hasta disponer de Node/npm compatibles.

## Terminado

Auditoría; arquitectura; modelo e invariantes; estrategia RLS; pruebas/mantenimiento/entornos/despliegue; documentación viva y ADR.

Base declarativa de la API: configuración segura, CORS explícito, contratos de error, health check, correlación de peticiones y tests preparados. Frontend React/Vite: shell responsive, tokens visuales, accesibilidad y pruebas de componente preparadas. CI remoto de API y web creado. La sintaxis Python fue validada con `compileall`.

## Bloqueos y acciones

Node/npm no pueden instalarse en este equipo por restricción del usuario. Mantener React/Vite/Tailwind bloquea la ejecución local, build y validación completa de la Fase 1 hasta disponer de un entorno autorizado con Node. El commit `v1.001` ya fue enviado a GitHub y activó la validación remota; su detalle no se puede consultar anónimamente al ser un repositorio privado. Las dependencias Python tampoco se instalaron localmente; solo se verificó sintaxis. Falta generar y versionar `package-lock.json` en una máquina con Node para pasar de `npm install` a `npm ci`. Git está conectado a `origin` en GitHub, rama `main`. Véase `USER_ACTIONS.md`.

## Siguiente fase propuesta (no iniciada)

Reanudar Fase 1 cuando Node/npm estén disponibles en un entorno autorizado: scaffolding web/API, calidad, tests, contratos, layout y sistema visual.

## Referencias

- `docs/phases/phase-00-audit-and-foundations.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/security.md`
