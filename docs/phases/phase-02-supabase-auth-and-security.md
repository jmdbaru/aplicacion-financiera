# Fase 2 — Supabase, autenticación y seguridad multiusuario

- Fecha de inicio: 2026-08-27
- Estado: en curso

## Objetivo y alcance

Configurar Supabase/Auth/RLS, sesión, rutas protegidas, perfil y preferencias regionales. Esta fase no incluye cuentas financieras ni ledger.

## Estado inicial

La Fase 1 fue aprobada por autorización explícita para continuar. API y web se validan remotamente en GitHub Actions. No existe proyecto Supabase, URL, clave anónima ni configuración local disponible en el repositorio.

## Trabajo realizado

- Se creó la primera migración versionada para perfiles y preferencias regionales.
- Se activó y forzó RLS en `public.profiles`.
- Se definieron políticas explícitas de lectura y actualización del propio perfil, limitadas a `authenticated`.
- Se añadió un trigger de alta desde `auth.users`, con nombre visible normalizado y sin confiar en valores del cliente; su función `SECURITY DEFINER` revoca ejecución a `PUBLIC`.
- Se documentó el procedimiento de aplicación y rollback.
- Se añadió `supabase/SETUP_FASE_2.sql` para aplicar el alcance de esta fase desde el SQL Editor sin instalar la CLI.

## Seguridad y RLS

La tabla no permite operaciones de `anon`. El usuario autenticado solo puede consultar o actualizar su fila. La creación de perfil se realiza desde un trigger `security definer` con `search_path` fijo.

El asesor de seguridad detectó que el privilegio por defecto de ejecución seguía exponiendo la función del trigger a roles de API. Se añade una migración correctiva que revoca explícitamente `PUBLIC`, `anon` y `authenticated`. También se detectó una tabla `public.categories` preexistente, con RLS activo pero políticas antiguas dirigidas a `public`; no se modifica porque corresponde a la Fase 4 y requiere una revisión específica de producto y datos existentes.

## Estado del proyecto Supabase

Se identificó el proyecto conectado `supabase-copper-clock`, se restauró con autorización del usuario y alcanzó estado activo. Se aplicaron las migraciones remotas `profiles_and_preferences` y `revoke_profile_trigger_execute`.

La verificación directa confirmó que `public.profiles` tiene RLS habilitada y forzada, con una política `SELECT` y otra `UPDATE`, ambas dirigidas solo al rol `authenticated` y restringidas por `(select auth.uid()) = user_id`.

El asesor de seguridad confirmó que ya no hay funciones `SECURITY DEFINER` de perfiles ejecutables desde `anon` ni `authenticated`. Mantiene un aviso informativo de exposición GraphQL para `profiles`: es esperado porque el rol autenticado necesita acceder a su propio perfil y RLS restringe las filas.

Los avisos restantes de seguridad y rendimiento pertenecen a `public.categories`, una tabla preexistente: usa políticas antiguas para `public`, se expone por GraphQL y tiene un índice/recomendaciones de RLS pendientes. No se modificó porque es alcance de la Fase 4 y requerirá revisión específica.

## Prueba RLS con dos usuarios

Se crearon dos cuentas de prueba sin datos personales. Con cada identidad se simuló una sesión del rol `authenticated` dentro de una transacción revertida: cada una vio exactamente un perfil, el suyo; no pudo ver el del otro. Un intento de actualizar el perfil ajeno devolvió cero filas y la actualización del propio devolvió una fila. Al terminar cada prueba se ejecutó `ROLLBACK`, por lo que no se persistieron cambios.

El asesor de seguridad mantiene dos avisos de GraphQL ya documentados: `categories` (preexistente, fuera de alcance) y `profiles` para el rol autenticado (necesario para la aplicación y protegido por RLS). También informa de que está desactivada la protección contra contraseñas filtradas de Supabase Auth; debe activarse antes de habilitar el registro real.

## Próximas acciones de esta fase

Conectar el cliente web/API con variables de entorno validadas y completar los flujos de sesión.

## Criterios de aceptación

- [x] Migración base de perfiles y preferencias versionada.
- [x] RLS y políticas explícitas definidas.
- [x] Alta de perfil atómica asociada a Auth.
- [x] Proyecto Supabase configurado y migración aplicada.
- [ ] Sesión y rutas protegidas integradas.
- [x] Pruebas RLS negativas con dos usuarios.
- [ ] Flujo de registro, acceso, salida y recuperación probado.
