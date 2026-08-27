# Changelog

## [Unreleased]

### Added

- Documentación viva y estado de continuidad.
- Arquitectura, modelo lógico y estrategia RLS.
- ADR para monorepositorio, ledger y Supabase.
- Estrategias de pruebas, despliegue y diagnóstico.
- Reglas de exclusión y formato.
- Base declarativa de API FastAPI con health check, configuración segura y pruebas preparadas.
- Workflow de GitHub Actions para calidad de API.
- Lockfile versionado del frontend y CI web con instalaciones deterministas mediante `npm ci`.
- Migración base de perfiles y preferencias regionales con RLS para Supabase.
- Endpoints protegidos para consultar y actualizar el perfil a través de Supabase Auth, PostgREST y RLS.

### Changed

- Fase 0 aprobada; Fase 1 iniciada y bloqueada antes de implementación por ausencia de Node/npm en el entorno autorizado.
- Fase 1 implementada y validada en GitHub Actions; queda en revisión del usuario antes de iniciar la Fase 2.
- Fase 1 aprobada; Fase 2 iniciada con migración base y pendiente de conexión a Supabase.
- Fase 2 aprobada tras validar en navegador el flujo de sesión y preferencias; Fase 3 iniciada.
