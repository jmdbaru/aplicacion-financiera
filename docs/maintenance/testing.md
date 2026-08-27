# Estrategia de pruebas

- Unitarias: reglas monetarias, ledger, periodos, redondeos y validadores.
- Integración: API, repositorios, migraciones y RPC.
- Componentes: formularios, carga/vacío/error y accesibilidad.
- E2E: autenticación y flujos financieros críticos según existan.
- Seguridad: matriz RLS con dos usuarios y autorización negativa.

## Puertas previstas para Fase 1

Frontend: formato, ESLint, TypeScript, tests y build. Backend: Ruff, comprobación estática elegida en la fase, Pytest y OpenAPI. Repositorio: secretos y dependencias.

## Estado actual

La Fase 3 se validó localmente con Ruff y 12 pruebas API. El frontend pasó lint, 3 pruebas y build mediante el runtime aislado disponible; GitHub Actions repite la instalación determinista, tipos, pruebas y build con Node 24. Las comprobaciones SQL remotas cubrieron aislamiento entre dos usuarios, rechazo de asientos descuadrados, transferencia y reverso con saldo cero.

Comandos de referencia:

```text
python -m ruff check apps\\api
python -m pytest apps\\api\\tests -q
cd apps/web
npm ci
npm run check
npm run build
```

La validación manual de la Fase 3 está descrita en `USER_ACTIONS.md` y debe ejecutarse en la vista previa con una sesión autenticada.

## Lockfile web

`apps/web/package-lock.json` está versionado y coincide con el manifiesto. El job de calidad web usa exclusivamente `npm ci` para instalaciones deterministas.
