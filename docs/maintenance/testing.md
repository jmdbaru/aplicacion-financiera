# Estrategia de pruebas

- Unitarias: reglas monetarias, ledger, periodos, redondeos y validadores.
- Integración: API, repositorios, migraciones y RPC.
- Componentes: formularios, carga/vacío/error y accesibilidad.
- E2E: autenticación y flujos financieros críticos según existan.
- Seguridad: matriz RLS con dos usuarios y autorización negativa.

## Puertas previstas para Fase 1

Frontend: formato, ESLint, TypeScript, tests y build. Backend: Ruff, comprobación estática elegida en la fase, Pytest y OpenAPI. Repositorio: secretos y dependencias.

## Estado actual

No hay código ejecutable ni dependencias. En Fase 0 se valida documentación, estructura, limpieza y ausencia de secretos evidentes.

