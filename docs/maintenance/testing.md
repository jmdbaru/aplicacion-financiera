# Estrategia de pruebas

- Unitarias: reglas monetarias, ledger, periodos, redondeos y validadores.
- Integración: API, repositorios, migraciones y RPC.
- Componentes: formularios, carga/vacío/error y accesibilidad.
- E2E: autenticación y flujos financieros críticos según existan.
- Seguridad: matriz RLS con dos usuarios y autorización negativa.

## Puertas previstas para Fase 1

Frontend: formato, ESLint, TypeScript, tests y build. Backend: Ruff, comprobación estática elegida en la fase, Pytest y OpenAPI. Repositorio: secretos y dependencias.

## Estado actual

La Fase 1 ya dispone de código ejecutable y validación remota. En local, mientras no se autorice instalar dependencias, se limita la comprobación a sintaxis Python y estructura; GitHub Actions ejecuta el resto de la suite.

## Lockfile web

Mientras no exista Node local, el workflow manual `Generate web lockfile` crea `apps/web/package-lock.json` en un runner de GitHub. Una vez versionado, el job de calidad web debe usar exclusivamente `npm ci`.
