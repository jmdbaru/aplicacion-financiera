# ADR 0003: Supabase Auth y RLS

- Estado: aceptada
- Fecha: 2026-08-27

## Decisión

Supabase Auth emite la identidad y PostgreSQL aplica RLS en cada tabla privada. La API usa preferentemente el contexto del usuario; `service_role` no es la ruta común.

## Consecuencias

Cada migración necesita políticas y pruebas negativas. La defensa en profundidad limita errores en otras capas.

