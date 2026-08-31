# Acciones del usuario

## Fase 9 — Validar informes en la vista previa

- Estado: `PENDIENTE`
- Pasos: inicia sesión, entra en **Informes**, cambia el rango de fechas, revisa ingresos/gastos/balance, comprueba el ranking por categorías y descarga el CSV.
- Dato a devolver: indica si funciona o el paso exacto y mensaje visible si falla.
- Verificación: los importes coinciden con los movimientos del periodo, la comparación usa el periodo anterior de igual duración y el CSV se descarga con filas legibles.

## Fase 8 — Validar patrimonio en la vista previa

- Estado: `PENDIENTE`
- Pasos: inicia sesión, entra en **Patrimonio**, crea un activo y un pasivo, actualiza una valoración, comprueba patrimonio neto, variación e historial, y prueba archivar/restaurar.
- Dato a devolver: indica si funciona o el paso exacto y mensaje visible si falla.
- Verificación: los activos suman en positivo, los pasivos restan, la valoración no crea movimientos ni cambia saldos de cuentas, y el histórico conserva snapshots por fecha.

## Endurecimiento futuro — Exposición GraphQL de tablas públicas

- Estado: `PENDIENTE`
- Motivo: el asesor de seguridad de Supabase avisa que las tablas con `SELECT` para `authenticated`, incluidas `wealth_items` y `wealth_valuations`, son visibles en el esquema GraphQL.
- Pasos: en una fase de endurecimiento, decidir si se deshabilita GraphQL para el proyecto o se revocan permisos específicos manteniendo PostgREST operativo.
- Dato que debes devolver: decisión de arquitectura cuando preparemos producción.
- Verificación: los avisos `pg_graphql_authenticated_table_exposed` dejan de aparecer sin romper la app.

## Fase 7 — Validar objetivos de ahorro en la vista previa

- Estado: `PENDIENTE`
- Pasos: inicia sesión, entra en **Objetivos**, crea una meta, registra dos aportaciones, comprueba progreso e historial y prueba cerrar/archivar.
- Dato a devolver: indica si funciona o el paso exacto y mensaje visible si falla.

## Fase 4 — Validar categorías y presupuestos en la vista previa

- Estado: `COMPLETADA`
- Motivo: migraciones, reglas, API, interfaz y despliegue están comprobados; el usuario autorizó expresamente el avance a la Fase 5.
- Pasos: abre `https://jmdbaru.github.io/aplicacion-financiera/`, inicia sesión y entra en **Categorías**. Crea una categoría personal de gasto y una subcategoría. Registra un gasto en esa subcategoría desde **Movimientos**. En **Presupuestos**, crea un límite mensual para la categoría raíz, comprueba el gasto y el restante, y después revierte el movimiento. Prueba un gasto sin categoría, una transferencia y archivar/restaurar una categoría personal.
- Dato que debes devolver: indica si todo funciona o el paso exacto y el mensaje visible si algo falla. No compartas contraseñas, tokens ni capturas con datos privados.
- Verificación: el gasto de la subcategoría consume el presupuesto raíz; el reverso lo compensa; el gasto sin categoría aparece como fuera de presupuesto; transferencia y ajuste no permiten categoría; el archivo conserva el histórico.
- Consecuencia de posponer: no aplica; la Fase 4 está aprobada.

## Fase 3 — Validar cuentas y movimientos en la vista previa

- Estado: `COMPLETADA`
- Motivo: la implementación automática, la base de datos, la API, el frontend y el despliegue están comprobados; falta confirmar con tu criterio el recorrido financiero completo usando una sesión real.
- Pasos: abre `https://jmdbaru.github.io/aplicacion-financiera/`, inicia sesión con una cuenta de prueba y crea dos cuentas en EUR. Registra un ingreso, un gasto y una transferencia entre ambas. Comprueba los saldos, usa la búsqueda y el filtro de fechas, revierte la transferencia, archiva una cuenta y restáurala.
- Dato que debes devolver: indica si todo funciona o describe el paso exacto y el mensaje visible si encuentras un problema. No compartas la contraseña ni ningún token.
- Verificación: los saldos cambian una sola vez por operación; la transferencia mantiene el total conjunto; el reverso devuelve ambos saldos; el histórico sigue visible tras archivar y la cuenta se puede restaurar.
- Consecuencia de posponer: no aplica; el usuario aprobó la fase y autorizó la Fase 4.

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

## Fase 2 — Validación funcional de autenticación

- Estado: `COMPLETADA`
- Motivo: se verificaron en la vista previa el alta/acceso, la sesión, el cierre y la edición de preferencias.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: la aplicación creó o recuperó el perfil protegido y mantuvo la sesión esperada.
- Consecuencia de posponer: no aplica.

## Antes de producción — Restaurar endurecimiento de Auth

- Estado: `PENDIENTE`
- Motivo: para permitir la prueba inmediata se desactivó temporalmente la confirmación de correo.
- Pasos: en **Authentication → Sign In / Providers → Email**, activa de nuevo **Confirm email**; mantén habilitado **Enable Email Signups**. Configura un SMTP propio antes de abrir el registro a usuarios reales y activa la protección contra contraseñas filtradas.
- Dato que debes devolver: confirma los cambios cuando se prepare producción, sin copiar credenciales SMTP.
- Verificación: una cuenta nueva no obtiene sesión hasta confirmar el enlace recibido; los avisos de contraseña comprometida dejan de aparecer en el asesor de seguridad.
- Consecuencia de posponer: cualquier persona podría registrar una dirección que no controla y la entrega de correos seguirá limitada por el servicio predeterminado.

## Después de las pruebas — Limpiar cuentas temporales

- Estado: `PENDIENTE`
- Motivo: existen cuentas de prueba creadas para comprobar RLS y el flujo de alta.
- Pasos: cuando finalicen las pruebas, elimina desde **Authentication → Users** las cuentas temporales identificadas como pruebas RLS o vista previa. No eliminar perfiles directamente desde SQL.
- Dato que debes devolver: confirma que se han retirado, sin enviar correos ni identificadores.
- Verificación: no quedan usuarios de prueba en Auth ni perfiles asociados por el borrado en cascada.
- Consecuencia de posponer: las cuentas no suponen acceso a datos ajenos por RLS, pero ensucian el entorno de desarrollo.

## Fase 2 — Incorporar el lockfile del SDK de Supabase

- Estado: `COMPLETADA`
- Motivo: el lockfile reproducible del SDK oficial ya está incorporado.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: el workflow `Quality` validará `npm ci`, pruebas y build con el SDK.
- Consecuencia de posponer: no aplica.

## Fase 2 — Configuración pública del cliente en despliegue

- Estado: `COMPLETADA`
- Motivo: el cliente necesita la URL y clave publishable de Supabase al ejecutarse en un navegador.
- Pasos: no requiere ninguna acción para la vista previa actual. Al crear otro despliegue, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los datos públicos del proyecto. No uses ni compartas una clave `service_role`.
- Dato que debes devolver: ninguno para la vista previa actual.
- Verificación: el formulario de acceso ya usa Supabase Auth y carga el perfil protegido por RLS.
- Consecuencia de posponer: no aplica a la vista previa; sí bloqueará el acceso en un despliegue nuevo.

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
