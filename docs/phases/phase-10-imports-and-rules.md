# Fase 10 — Importación y reglas automáticas

Implementación técnica completada en `v1.034`.

- Supabase: batches de importación, filas de staging, reglas de categorización y RPC `confirm_import_batch`.
- Web: pestaña **Importar** con preview, validación por fila, detección de duplicados dentro del archivo, reglas por texto/prioridad y confirmación.
- Ledger: las filas confirmadas crean movimientos balanceados y guardan `import_fingerprint` para evitar duplicados por reintentos.
- Seguridad: staging y reglas están protegidos por RLS; la confirmación exige usuario autenticado y cuenta activa propia.

## Alcance de archivo

El soporte implementado acepta CSV y Excel guardado/exportado como CSV. La lectura directa de `.xlsx` queda pendiente hasta incorporar una dependencia de parser Excel y su lockfile en un entorno autorizado.

## Validación funcional pendiente

Entrar en **Importar**, crear una regla, subir un CSV pequeño, revisar filas listas/invalidas/duplicadas, guardar preview, confirmar y comprobar que aparecen movimientos y saldos correctos.
