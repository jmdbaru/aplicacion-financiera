# Supabase

Las migraciones se aplicarán al proyecto Supabase cuando exista una conexión autorizada. No se almacenan URLs privadas, tokens ni claves en esta carpeta.

## Fase 2

La migración `202608270001_profiles_and_preferences.sql` crea el perfil del usuario, preferencias regionales, trigger de alta y RLS.

Antes de aplicarla, revisar el informe de Fase 2. Después, ejecutar las pruebas de aislamiento con dos usuarios descritas en `docs/architecture/security.md`.

## Recuperación

La migración no elimina tablas existentes. Para revertirla en un entorno sin datos de producción se deben retirar primero el trigger sobre `auth.users`, las funciones y políticas, y finalmente `public.profiles`. En producción, no eliminar perfiles sin un procedimiento de exportación y borrado de cuenta aprobado.

