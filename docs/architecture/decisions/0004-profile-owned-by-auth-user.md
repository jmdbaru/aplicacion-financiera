# ADR 0004: Perfil uno a uno gestionado desde Auth

- Estado: aceptada
- Fecha: 2026-08-27

## Decisión

Cada fila de `public.profiles` usa el UUID de `auth.users` como clave primaria y se crea mediante un trigger después del alta de Auth. Las preferencias regionales viven en ese perfil.

## Consecuencias

Se impide que el cliente elija la identidad del perfil y se simplifican las políticas RLS. El trigger debe mantenerse con privilegios mínimos y ser cubierto por pruebas con dos usuarios.

