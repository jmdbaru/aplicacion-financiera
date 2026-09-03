# Pendientes centralizados del proyecto

> Documento único de continuidad. Separa lo que está implementado de lo que todavía requiere validación funcional, decisión de producto o una acción manual de producción.
>
> Actualizado: 2026-09-03

## Diagnóstico ejecutivo

La aplicación tiene implementadas las fases técnicas 0 a 12: arquitectura, API FastAPI, frontend React/Vite, Supabase Auth/RLS, perfiles, cuentas, ledger, categorías, presupuestos, dashboard, recurrentes, calendario, objetivos, patrimonio, informes, importación, inversiones, repartos y consolidación UX.

No todas las fases están cerradas del mismo modo:

- **Aprobadas funcionalmente:** Fases 2 y 3; la Fase 4 quedó aceptada para continuar según el historial de trabajo.
- **Implementadas y pendientes de validación funcional guiada:** Fases 5 a 12, especialmente objetivos, patrimonio, informes, importación, inversiones y la consolidación visual.
- **Pendientes de producción o de decisión:** endurecimiento de Auth, reconciliación de migraciones, GraphQL, SMTP, limpieza de usuarios de prueba, parser XLSX, precios de mercado y división del bundle.

La calidad automática actual es correcta: Ruff/API documentados, TypeScript, ESLint, 17 pruebas web y build Vite de producción. El build avisa de un bundle principal superior a 500 kB; no es un fallo funcional.

## Orden recomendado para cerrar el proyecto

### 1. Validación funcional de la experiencia actual

Usar una cuenta de prueba y recorrer:

1. Inicio: selector de moneda, carrusel y alta rápida.
2. Movimientos: selector semanal, filtros, biblioteca, separadores diarios y reverso.
3. Cuentas: píldoras de tipos, detalle, movimientos asociados, archivo y borrado protegido.
4. Categorías: categorías/subcategorías, colores, iconos y archivo.
5. Objetivos: crear, aportar, completar y consultar el toggle de completados.
6. Calendario: cambiar mes, seleccionar un día, revisar colores, separación y balance por moneda.
7. Recurrentes: crear una regla, generar una ocurrencia y confirmar que no duplica operaciones.
8. Repartos: crear evento, participantes, gasto, participantes afectados, liquidación y “marcar pagado”.
9. Configuración: combinación de color de acento con los cuatro estilos de espacio.

**Cierre:** anotar pantalla, paso y mensaje visible de cualquier incidencia. No compartir contraseñas, tokens ni capturas con datos privados.

### 2. Validar módulos implementados pero no expuestos actualmente

Patrimonio, Inversiones e Importar están preparados en código, pero permanecen ocultos o pendientes de validación guiada.

- Patrimonio: activo, pasivo, valoración, patrimonio neto, variación y archivo/restauración; las valoraciones no deben alterar el ledger.
- Inversiones: cartera, instrumento, compra, valoración manual, coste neto, valor de mercado y resultado.
- Importar: regla, CSV, preview, filas inválidas, duplicados, confirmación y saldos.

### 3. Endurecimiento antes de producción

- Activar de nuevo **Confirm email** en Supabase cuando exista SMTP propio.
- Mantener **Email Signups** solo mientras sea necesario y configurar límites adecuados.
- Activar la protección contra contraseñas comprometidas.
- Añadir la URL de preview y, al publicar, la URL definitiva en **Authentication → URL Configuration**.
- Eliminar únicamente las cuentas de prueba desde **Authentication → Users** cuando terminen las pruebas.
- Revisar el aviso de exposición GraphQL de tablas autenticadas. Decidir entre deshabilitar GraphQL o revocar permisos concretos sin romper PostgREST.
- Reconciliar el historial remoto de migraciones con `supabase/migrations/202608310004_investments.sql`; el SQL está verificado, pero el wrapper no registró esa migración correctamente.

### 4. Mejoras técnicas posteriores

- Incorporar lectura directa de `.xlsx` con una dependencia de parser y lockfile versionado; actualmente se admite CSV o Excel exportado como CSV.
- Dividir el bundle web mediante carga bajo demanda de informes, importación, inversiones, patrimonio y repartos. Medir el paquete inicial y la navegación después.
- Decidir si el estilo de espacio debe pasar de `localStorage` a una preferencia persistida en `profiles` para sincronizarlo entre dispositivos.
- Si se automatizan inversiones, elegir proveedor de precios, frecuencia, caché, límites y comportamiento ante cotizaciones ausentes.
- Repetir la medición de índices Supabase con datos de producción antes de retirar o modificar índices.

### 5. Mejoras UX no bloqueantes

- Personalización de widgets del dashboard.
- Navegación móvil inferior si el uso móvil lo justifica.
- Revisión visual pantalla por pantalla con datos reales anonimizados.
- Revisión de taxonomía de categorías cuando crezca el catálogo: grupos, profundidad máxima, sugerencias y edición masiva.

## Dependencias y entorno

- El frontend requiere Node/npm para desarrollo local, pero CI y el runtime aislado ya permiten comprobarlo.
- Para trabajar localmente en otra máquina: Node.js 24.19.0, npm y `npm ci` dentro de `apps/web`.
- No guardar claves `service_role` ni secretos SMTP en el repositorio. El cliente solo debe recibir la URL y la clave publishable de Supabase.

## Referencias de implementación

- Estado resumido: `PROJECT_STATUS.md`.
- Acciones manuales y validaciones históricas: `USER_ACTIONS.md`.
- Changelog versionado: `CHANGELOG.md`.
- Fases detalladas: `docs/phases/`.
- Diseño y decisiones: `docs/design/` y `docs/architecture/`.
- SQL y migraciones: `supabase/migrations/`.

## Regla de mantenimiento

Cada pendiente debe tener estado (`PENDIENTE`, `EN CURSO`, `BLOQUEADO` o `COMPLETADO`), contexto, criterio de cierre y fecha de actualización. Cuando se cierre una tarea, actualizar este documento y `PROJECT_STATUS.md`; no crear otra lista paralela.
