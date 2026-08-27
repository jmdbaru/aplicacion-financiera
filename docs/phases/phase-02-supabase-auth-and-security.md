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
- Se definieron políticas explícitas de lectura y actualización del propio perfil.
- Se añadió un trigger de alta desde `auth.users`, con nombre visible normalizado y sin confiar en valores del cliente.
- Se documentó el procedimiento de aplicación y rollback.

## Seguridad y RLS

La tabla no permite operaciones de `anon`. El usuario autenticado solo puede consultar o actualizar su fila. La creación de perfil se realiza desde un trigger `security definer` con `search_path` fijo. La prueba obligatoria pendiente es verificar con dos usuarios que no pueden leer ni actualizar el perfil del otro.

## Bloqueo externo

Falta crear o seleccionar un proyecto Supabase y configurar sus variables públicas/servidor fuera del repositorio. Sin ello no se puede aplicar la migración, validar Auth, probar RLS contra PostgreSQL ni completar las rutas protegidas reales.

## Próximas acciones de esta fase

Cuando exista el proyecto, aplicar la migración, crear dos usuarios de prueba no sensibles, ejecutar la matriz RLS y conectar el cliente web/API con variables de entorno validadas.

## Criterios de aceptación

- [x] Migración base de perfiles y preferencias versionada.
- [x] RLS y políticas explícitas definidas.
- [x] Alta de perfil atómica asociada a Auth.
- [ ] Proyecto Supabase configurado y migración aplicada.
- [ ] Sesión y rutas protegidas integradas.
- [ ] Pruebas RLS negativas con dos usuarios.
- [ ] Flujo de registro, acceso, salida y recuperación probado.

