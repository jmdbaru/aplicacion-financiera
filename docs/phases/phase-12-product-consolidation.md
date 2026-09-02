# Fase 12 — Consolidación de producto

## Objetivo

Conservar la estructura ERP y la identidad visual, pero reducir la carga cognitiva de cada pantalla. El movimiento financiero vuelve a ser la acción primaria; configuración, filtros y funcionalidad avanzada se muestran bajo demanda.

## Auditoría y decisiones

- El ledger de doble partida, las RPC atómicas y RLS son una base adecuada y se mantienen.
- Los filtros de movimientos se aplicaban después de descargar una sola página. Se trasladaron a Supabase para que resultado, total y paginación sean coherentes.
- Las relaciones de repartos comprobaban propiedad, pero no siempre pertenencia al mismo evento. Las nuevas políticas cierran ese cruce lógico.
- Varias claves foráneas carecían de índice de respaldo. Se añadieron sin cambiar datos ni contratos existentes.
- Un ciclo en variables CSS de tema podía invalidar el fondo de botones. Se corrigió sin cambiar las paletas disponibles.

## Experiencia implementada

- Acción rápida global para registrar un movimiento y atajo de teclado `N`.
- Formulario de movimiento con tipo segmentado, concepto e importe prioritarios y recuerdo local de la última cuenta.
- Filtros de movimientos y cuentas plegados hasta que el usuario los solicita.
- Objetivos en lista compacta; aportaciones, historial y cierre viven en una vista de detalle dentro del dashboard.
- Repartos separados en gastos y liquidaciones, manteniendo historial de eventos y pagos realizados.
- Transiciones breves entre espacios y revelado de controles; se desactivan cuando el sistema solicita reducir movimiento.

## Base de datos

- `202609020002_database_hardening.sql`: índices de claves foráneas y políticas RLS coherentes para repartos.
- `202609020003_server_side_transaction_search.sql`: consulta paginada y filtrada del ledger con `SECURITY INVOKER`.
- Ambas migraciones se aplicaron al proyecto remoto y la RPC se invocó correctamente con contexto autenticado simulado.
- El asesor no muestra claves foráneas sin índice. Los avisos de exposición GraphQL autenticada se conservan como decisión pendiente porque retirar `SELECT` rompería el acceso Data API actual.

## Validación

- TypeScript y ESLint: correctos.
- Vitest: 10 archivos y 17 pruebas correctas.
- Build Vite de producción: correcto; queda pendiente dividir el paquete principal, actualmente superior a 500 kB minificado.
- Ruff y Pytest: correctos, 31 pruebas API.
- Navegador local: cuentas ocultan filtros inicialmente, la acción rápida permanece visible y repartos carga sin errores visibles.

## Pendientes conscientes

- Dividir por rutas o carga diferida los módulos secundarios para reducir el JavaScript inicial.
- Repetir la medición de índices con volumen de producción antes de eliminar cualquiera por falta de uso.
- Resolver antes de producción los avisos de GraphQL y protección de contraseñas filtradas ya registrados en `USER_ACTIONS.md`.
- Validar con el usuario cada pantalla simplificada antes de incorporar nuevos dominios.

## Reversión

Los cambios visuales pueden revertirse sin afectar datos. Los índices pueden retirarse individualmente si las mediciones futuras lo justifican. Las políticas RLS anteriores no deben restaurarse porque permitían relaciones incoherentes; cualquier cambio futuro debe conservar la validación de evento y propietario.
