# Fase 8 — Patrimonio

Implementación técnica completada en `v1.032`.

- Supabase: posiciones patrimoniales, valoraciones por fecha, RLS forzada y RPC de resumen.
- API: contratos para crear posiciones, archivar/restaurar y registrar valoraciones.
- Web: pestaña **Patrimonio** con activos, pasivos, patrimonio neto, variación y últimos snapshots.
- Criterio contable: las valoraciones no crean movimientos ni modifican el flujo de efectivo del ledger.

## Validación funcional pendiente

Crear un activo y un pasivo, actualizar al menos una valoración, comprobar el patrimonio neto, archivar/restaurar una posición y verificar que los movimientos y saldos de cuentas no cambian.
