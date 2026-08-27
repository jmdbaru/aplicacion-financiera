# ADR 0001: Monorepositorio y fronteras de servicio

- Estado: aceptada como base inicial
- Fecha: 2026-08-27

## Decisión

Usar un monorepositorio con `apps/web`, `apps/api`, `supabase` y documentación compartida. La API concentra reglas financieras; PostgreSQL/RLS protege invariantes y aislamiento; la web consume contratos versionados.

## Consecuencias

Permite cambios coordinados y despliegues separados. Exige CI por áreas y evitar acoplar la web a la persistencia.

