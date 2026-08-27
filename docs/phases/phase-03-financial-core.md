# Fase 3 — Núcleo financiero: cuentas y ledger

- Fecha de inicio: 2026-08-27
- Fecha de finalización técnica: 2026-08-27
- Estado final: en revisión, pendiente de validación funcional del usuario y aprobación expresa

## Objetivo y alcance

Crear el núcleo contable de la aplicación: cuentas financieras privadas, transacciones y entradas de doble partida. La fase incluye ingresos, gastos, ajustes, transferencias atómicas, saldos derivados, consulta paginada, filtros, búsqueda y archivo reversible de cuentas sin destruir el histórico.

## Estado inicial encontrado

La Fase 2 estaba aprobada y Supabase Auth, `profiles`, RLS y preferencias ya se habían validado con dos usuarios. No existían tablas de cuentas ni ledger. El modelo lógico y el ADR de doble partida ya establecían los invariantes de propiedad, suma cero, atomicidad y reversos trazables.

## Trabajo realizado

- Se crearon cuentas financieras con tipo, moneda, estado activo/archivado y propiedad por usuario.
- Se implementaron cabeceras y entradas contables de doble partida, sin guardar un saldo mutable.
- Se añadieron RPC atómicas para ingresos, gastos, ajustes, transferencias y reversos.
- Se expusieron contratos y rutas FastAPI protegidas para cuentas, saldos y movimientos.
- Se construyó el espacio web de cuentas y movimientos con resumen, altas, archivo/restauración, formularios de operación, filtros, búsqueda, paginación, skeletons y estados vacíos/error.
- Se añadió cobertura de integración del cálculo de saldos derivados en la API.

## Archivos, migraciones y componentes principales

- `supabase/migrations/202608270003_financial_accounts.sql`
- `supabase/migrations/202608270004_ledger_tables.sql`
- `supabase/migrations/202608270005_ledger_atomic_operations.sql`
- `supabase/migrations/202608270006_ledger_fk_indexes.sql`
- `apps/api/src/financiera_api/finance_schemas.py`
- `apps/api/src/financiera_api/finance_api.py`
- `apps/api/src/financiera_api/api.py`
- `apps/api/tests/test_finance_api.py`
- `apps/web/src/finance.ts`
- `apps/web/src/FinanceWorkspace.tsx`
- `apps/web/src/finance.test.ts`
- `apps/web/src/App.tsx` y `apps/web/src/styles.css`

## Decisiones técnicas y motivo

- Los importes usan `numeric(20,4)` y los saldos se derivan de `ledger_entries`; así no existe un saldo mutable que pueda divergir del histórico.
- Cada relación privada incluye `user_id` y claves foráneas compuestas para impedir referencias cruzadas entre usuarios incluso si la aplicación cometiera un error.
- Ingresos y gastos usan una contrapartida externa explícita en la entrada, mientras que las transferencias solo permiten cuentas propias de la misma moneda.
- Las operaciones contabilizadas no se editan ni borran: se corrigen mediante un reverso enlazado y auditable.
- Las escrituras del ledger pasan por funciones `SECURITY DEFINER` con `search_path` fijo, `auth.uid()` obligatorio, validación de propiedad y permisos limitados a `authenticated`, porque la suma cero debe comprobarse dentro de una única transacción de PostgreSQL.

## Cambios en base de datos y rollback

Las cuatro migraciones están aplicadas en el proyecto Supabase y aparecen en el historial remoto. El esquema fuerza RLS en `financial_accounts`, `ledger_transactions` y `ledger_entries`; las escrituras directas del ledger no se conceden al cliente.

Rollback recomendado, solo si no existen datos reales: revocar ejecución de las dos RPC, eliminar primero `ledger_entries`, después `ledger_transactions` y finalmente `financial_accounts`, y retirar sus funciones auxiliares. Si existen datos, no se debe ejecutar un rollback destructivo: crear una migración correctiva expand/contract y conservar el histórico.

## Endpoints, contratos y reglas de negocio

- Cuentas: listado con saldo derivado, alta y actualización/archivo.
- Movimientos: alta atómica, listado paginado con búsqueda y rango de fechas, y reverso.
- Un movimiento requiere al menos dos entradas, importes no nulos y suma cero por moneda.
- Una transferencia no admite contrapartidas externas y sus cuentas deben compartir moneda.
- La identidad siempre procede del JWT validado; no se acepta un `user_id` enviado por el cliente.
- Una cuenta archivada conserva movimientos e historial y puede restaurarse.

## Seguridad y RLS revisadas

- Se verificó con dos usuarios que una cuenta no puede leer cuentas ajenas.
- Se comprobó que un asiento descuadrado es rechazado por la base de datos.
- Se ejecutó una transferencia y su reverso dentro de una transacción de prueba revertida: 2 transacciones, 4 entradas y saldo agregado cero.
- El asesor de rendimiento ya no informa claves foráneas sin índice. Solo marca como no usado un índice recién creado, algo esperado sin carga real.
- El asesor de seguridad avisa que las tablas son visibles por GraphQL a usuarios autenticados y que las RPC `SECURITY DEFINER` son ejecutables por `authenticated`. Ambas exposiciones son intencionadas y siguen protegidas por RLS, `auth.uid()`, propiedad y permisos mínimos. No se concede acceso a `anon` ni se usa `service_role` en el cliente.

## Pruebas ejecutadas y resultados

- `python -m ruff check apps\\api`: correcto.
- `python -m pytest apps\\api\\tests -q`: 12 pruebas correctas.
- `npm run lint`: correcto en el runtime de trabajo disponible.
- `npm run test -- --run`: 3 pruebas web correctas.
- `npm run build`: build Vite correcto; 1.764 módulos transformados y bundle principal de aproximadamente 223 kB (70 kB gzip).
- Migraciones y pruebas SQL remotas: correctas y revertidas cuando usaron datos temporales.
- GitHub Actions `Quality` para `v1.024` y `v1.025`: correcto.
- GitHub Pages para `v1.025`: despliegue correcto; la pantalla de acceso carga sin errores de consola.

Los avisos locales de Starlette sobre `httpx` y de escritura de `.pytest_cache` pertenecen al entorno y no alteran las 12 pruebas superadas.

## Incidencias y resolución

- El modelo inicial de ingreso/gasto necesitaba representar una contrapartida fuera de las cuentas propias. Se añadió `entry_kind=external` con `account_id` nulo y validaciones específicas, manteniendo la doble partida.
- El asesor detectó índices ausentes en claves foráneas del ledger. Se añadió la migración `202608270006_ledger_fk_indexes.sql` y se repitió la revisión.
- GitHub Pages devolvió 404 al crear un despliegue porque Pages no estaba habilitado con GitHub Actions. El usuario corrigió la configuración y el despliegue siguiente terminó correctamente.
- El equipo no permite instalar Node de forma convencional. Las comprobaciones se ejecutaron con el runtime aislado disponible y también en GitHub Actions, conservando `package-lock.json` como lockfile oficial.

## Deuda técnica real

- Falta la prueba funcional manual completa con una sesión autenticada en la vista previa; está detallada en `USER_ACTIONS.md` y no requiere compartir credenciales.
- La advertencia deprecada de `TestClient` deberá resolverse cuando FastAPI/Starlette adopten el cliente sucesor; no justifica cambiar dependencias de forma aislada en esta fase.
- El índice de consulta por cuenta/fecha aún aparece como no usado porque el proyecto no tiene carga representativa. Debe conservarse hasta medir patrones reales, no eliminarse por una señal prematura.

## Validación manual recomendada

Entrar en la vista previa con un usuario de prueba, crear dos cuentas EUR, registrar un ingreso, un gasto y una transferencia, comprobar los saldos, buscar/filtrar el movimiento y revertir la transferencia. Confirmar también que archivar una cuenta no elimina su histórico y que puede restaurarse.

## Criterios de aceptación

- [x] Cuentas privadas con RLS y tipos, monedas y estados validados.
- [x] Ledger de doble partida que conserva suma cero por moneda.
- [x] Ingresos, gastos, ajustes y transferencias atómicos.
- [x] Saldos derivados y listado paginado con filtros y búsqueda.
- [x] CRUD seguro sin destrucción de historial contabilizado.
- [x] Pruebas de dominio, RLS, API, frontend, build y despliegue correctas.
- [ ] Validación funcional autenticada y aprobación expresa del usuario.

La implementación técnica de la Fase 3 está completa. La fase permanece en revisión y no autoriza iniciar la Fase 4.
