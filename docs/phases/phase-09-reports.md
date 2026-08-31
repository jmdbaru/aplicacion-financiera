# Fase 9 — Estadísticas e informes

Implementación técnica completada en `v1.033`.

- Supabase: RPC agregada `get_reports_overview` con filtros de periodo y moneda.
- API: contrato protegido para consultar el resumen de informes sin exponer filas crudas.
- Web: pestaña **Informes** con tendencias mensuales, comparativa contra periodo anterior, ranking por categoría y exportación CSV.
- Rendimiento: el cálculo pesado se resuelve en Postgres y el cliente recibe datos ya agregados.

## Validación funcional pendiente

Entrar en **Informes**, cambiar rango de fechas, revisar ingresos/gastos/balance, comprobar ranking de categorías y descargar el CSV inicial.
