# Fase 11 — Inversiones

Implementación técnica completada en `v1.035`.

- Supabase: carteras, instrumentos, operaciones, valoraciones manuales y RPC `get_investments_overview`.
- Web: pestaña **Inversiones** con carteras, instrumentos, operaciones, valoración manual y resumen de posiciones.
- Metodología: rendimiento simple = `valor mercado - coste neto + dividendos`, dividido por coste neto para el porcentaje por posición.
- Integración de efectivo: la cartera puede vincular una cuenta de efectivo, pero las operaciones de inversión no crean movimientos automáticos en el ledger para evitar doble contabilización.
- Mercado: no se integra ninguna fuente de precios de pago; los precios son manuales.

## Validación funcional pendiente

Crear una cartera, crear un instrumento, registrar una compra, añadir una valoración y comprobar valor de mercado, coste neto y resultado.

## Nota técnica Supabase

El wrapper de migraciones devolvió `INVALID_ARGUMENT` sin detalle para esta fase. La estructura se aplicó con SQL directo verificado, y queda pendiente reconciliar el historial remoto de migraciones antes de producción.
