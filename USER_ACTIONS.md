# Acciones del usuario

## Fase 0 — Revisar y aprobar la base

- Estado: `PENDIENTE`
- Motivo: se exige autorización expresa para avanzar.
- Pasos: revisar `PROJECT_STATUS.md`, los tres documentos de arquitectura y el informe de Fase 0.
- Dato que debes devolver: “apruebo la fase” o correcciones concretas.
- Verificación: se registrará la fase como aprobada.
- Consecuencia de posponer: no se inicia la Fase 1.

## Desarrollo local futuro — Node.js

- Estado: `PENDIENTE`
- Motivo: Node/npm no están disponibles y no está permitido instalar aplicaciones externas en este equipo. React/Vite/Tailwind los requieren para desarrollo local.
- Pasos: cuando exista un equipo o entorno autorizado con Node.js 24.19.0 y npm, ejecutar `npm ci` dentro de `apps/web`.
- Dato que debes devolver: confirma cuando el entorno esté disponible; no envíes secretos.
- Verificación futura: `node --version`, `npm --version` y `npm run check` deben ejecutarse correctamente.
- Consecuencia de posponer: no afecta a la CI remota ni a esta fase, pero impide el desarrollo y la previsualización local del frontend.

## Generar el lockfile web sin Node local

- Estado: `COMPLETADA`
- Motivo: `apps/web/package-lock.json` está disponible y coincide con `package.json`.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: el workflow `Quality` usará `npm ci` tras el siguiente commit.
- Consecuencia de posponer: no aplica.

## Validación remota mediante GitHub Actions

- Estado: `COMPLETADA`
- Motivo: el workflow `Quality` del commit `v1.003` finalizó correctamente para API y web.
- Pasos: no requiere ninguna acción adicional. No realizar despliegues desde Vercel ni Render en esta fase.
- Dato que debes devolver: ninguno.
- Verificación: API: Ruff correcto y 3 pruebas superadas. Web: ejecución completa con tic verde.
- Consecuencia de posponer: no aplica.

## Fase 2 — Crear o seleccionar el proyecto Supabase

- Estado: `COMPLETADA`
- Motivo: el proyecto Supabase conectado está activo y la migración de perfiles se aplicó correctamente.
- Pasos: no necesitas realizar ninguna acción ni compartir claves.
- Dato que debes devolver: ninguno.
- Verificación: `profiles` tiene RLS forzada y políticas de propiedad activas.
- Consecuencia de posponer: no aplica.

## Fase 2 — Pruebas con dos usuarios de Auth

- Estado: `COMPLETADA`
- Motivo: se crearon dos cuentas de prueba y se verificó RLS sin compartir contraseñas.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: cada cuenta vio solo su perfil; el intento de actualizar el perfil ajeno devolvió cero filas y el propio se pudo actualizar. Las pruebas se revirtieron.
- Consecuencia de posponer: no aplica.

## Fase 2 — Activar protección contra contraseñas filtradas

- Estado: `PENDIENTE`
- Motivo: el asesor de seguridad de Supabase detecta desactivada la comprobación de contraseñas comprometidas de Auth.
- Pasos: en Supabase abre **Authentication → Configuration → Password Security** y activa la protección contra contraseñas filtradas.
- Dato que debes devolver: confirma que está activada; no compartas claves ni contraseñas.
- Verificación: el aviso `auth_leaked_password_protection` dejará de aparecer en el asesor de seguridad.
- Consecuencia de posponer: el registro seguirá funcionando, pero aceptará contraseñas conocidas como comprometidas.

## Fase 2 — Incorporar el lockfile del SDK de Supabase

- Estado: `COMPLETADA`
- Motivo: el lockfile reproducible del SDK oficial ya está incorporado.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: el workflow `Quality` validará `npm ci`, pruebas y build con el SDK.
- Consecuencia de posponer: no aplica.

## Fase 2 — Configuración pública del cliente en despliegue

- Estado: `PENDIENTE`
- Motivo: el cliente necesita la URL y clave publishable de Supabase al ejecutarse en un navegador.
- Pasos: en el entorno donde publiques la web, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los datos públicos del proyecto. No uses ni compartas una clave `service_role`.
- Dato que debes devolver: confirma que las variables están configuradas, sin copiar sus valores.
- Verificación: el formulario de acceso permitirá usar las funciones de Supabase Auth y cargará el perfil protegido por RLS.
- Consecuencia de posponer: la aplicación se mostrará, pero el acceso no podrá conectarse al proyecto Supabase.

## Fase 2 — Autorizar la URL de vista previa en Supabase Auth

- Estado: `PENDIENTE`
- Motivo: los enlaces de confirmación de cuenta y recuperación de contraseña deben volver a la vista previa de GitHub Pages.
- Pasos: en Supabase abre **Authentication → URL Configuration**. Añade `https://jmdbaru.github.io/aplicacion-financiera/` a **Redirect URLs** y usa esa misma URL como **Site URL** mientras se prueba la aplicación.
- Dato que debes devolver: confirma que has guardado la configuración; no compartas claves ni contraseñas.
- Verificación: al crear una cuenta o recuperar la contraseña, el correo volverá a la aplicación de prueba en lugar de a una URL genérica.
- Consecuencia de posponer: el inicio de sesión con una cuenta ya creada funciona, pero los enlaces de confirmación y recuperación no podrán regresar correctamente a la web.

## Estado de Git

- Estado: `COMPLETADA`
- Motivo: el repositorio local está conectado a GitHub mediante `origin` y usa la rama `main`.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: `git remote -v` muestra el remoto configurado.
- Consecuencia de posponer: no aplica.
