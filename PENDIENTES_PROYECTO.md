# Pendientes centralizados del proyecto

> Documento único de continuidad. Separa lo que está implementado de lo que todavía requiere validación funcional, decisión de producto o una acción manual de producción.
>
> Actualizado: 2026-09-08

## Cierre de desarrollo — 2026-09-08

- **COMPLETADO:** Informes incorpora periodo diario, semanal, mensual y anual, navegación de calendario y fechas personalizadas. La migración local conserva categoría raíz y subcategoría en el ranking.
- **COMPLETADO:** Objetivos incorpora edición, pausa/reanudación, prioridad y frecuencia opcional; el ritmo mostrado es informativo y no genera notificaciones.
- **COMPLETADO:** carga diferida de espacios secundarios y chunks cacheables; el chunk de aplicación queda en 64.36 kB minificado.
- **COMPLETADO:** `20260908110000_reports_periods_and_category_hierarchy.sql` y `20260908110100_goal_planning_controls.sql` se aplicaron y verificaron en Supabase el 2026-09-08: columnas, restricción `paused`, índice, `SECURITY INVOKER` y ejecución solo para `authenticated`.
- **COMPLETADO:** `20260908110200_restore_budget_period_helper_execute.sql` restablece la ejecución autenticada del normalizador de periodos, corrigiendo la carga de Presupuestos y Resumen. Se aplicó y verificó en Supabase el 2026-09-08.
- **COMPLETADO:** se reconciliaron las 31 versiones locales y remotas; no hay versiones faltantes en ningún sentido. La última incorpora presupuestos recurrentes con vigencia y objetivos por saldo de cuenta.
- **PARCIALMENTE VERIFICADO:** Informes y Objetivos se han recorrido con una sesión ya autenticada sin escribir datos; faltan las mutaciones controladas y el aislamiento con dos usuarios.
- **PARCIALMENTE VERIFICADO:** la organización correcta ya está accesible; el asesor no reporta errores. Mantiene 34 avisos de exposición GraphQL de objetos públicos a `authenticated`, cuya solución requiere decidir si deshabilitar GraphQL o cambiar permisos sin romper PostgREST.

## Nueva auditoría de producto — decisiones UX pendientes

Estas son las preferencias expresadas en la última revisión y la recomendación adoptada para la siguiente iteración.

### Estado de implementación — 2026-09-03

- **Completado:** acciones de alta contextuales en Cuentas, Categorías, Presupuestos, Objetivos, Repartos y Recurrentes; el `+` flotante se reserva para el movimiento rápido.
- **Completado:** altas de cuentas, movimientos, categorías, presupuestos, objetivos y recurrencias con divulgación progresiva; categoría y subcategoría se seleccionan de forma dependiente.
- **Completado:** los formularios y preferencias que aún requieren foco se presentan como panel lateral contextual, no como diálogo centrado.
- **Pendiente:** llevar el patrón categoría → subcategoría a cualquier formulario adicional que se incorpore y realizar una revisión visual manual con datos reales anonimizados.

### Dirección visual recomendada

- Mantener la identidad verde y el shell ERP, pero reducir el aspecto de “botón genérico”: una sola acción primaria por pantalla, acciones secundarias en texto/contorno y el botón flotante `+` únicamente para alta rápida de movimientos.
- En Cuentas, Categorías, Objetivos y Repartos, preferir una barra de acciones contextual con icono + etiqueta; no usar varios botones circulares grandes.
- Sustituir la sensación de pantallas recargadas por el patrón **lista + detalle**: la lista permite localizar; el detalle se abre dentro del workspace, con pestañas o secciones, sin modal.
- Mantener animaciones breves y funcionales, con respeto a `prefers-reduced-motion`.

### Formularios y relaciones

- Usar formularios por pasos suaves: primero datos imprescindibles, después campos dependientes y por último “Más opciones”. No convertir cada alta en un wizard rígido.
- Los selectores dependientes deben aparecer bloqueados con una explicación breve y activarse al elegir el campo padre. Ejemplo: categoría → subcategoría; cuenta → moneda disponible; evento → participantes y gastos.
- Añadir relaciones útiles al dominio: cuenta y contracuenta en transferencias, categoría/subcategoría, regla recurrente, etiquetas/notas, fecha/hora, adjuntos futuros y vínculo a evento en repartos.
- Validar cada campo junto al propio control, reservar el resumen superior para errores generales y conservar el formulario si falla el guardado.

### Pop-ups y feedback

- Evitar modales para navegación, historiales y detalle. Usarlos solo para tareas breves que requieren foco: confirmar borrado irreversible, crear una operación rápida o editar una preferencia aislada.
- Preferir detalle inline, panel lateral contextual o pantalla de objeto para acciones complejas.
- Confirmaciones y errores normales deben ser avisos discretos abajo a la derecha durante 2–3 segundos; errores de campo permanecen inline hasta corregirse.

### Patrón de aplicación recomendado

La estructura más útil para este producto es:

1. **Dashboard:** saldo, balance, una gráfica/insight y dos acciones rápidas.
2. **List report:** filtros, búsqueda, ordenación y lista compacta (Movimientos, Cuentas, Categorías).
3. **Object view:** detalle del elemento seleccionado dentro del workspace, con historial y acciones en el encabezado.
4. **Progressive disclosure:** mostrar lo esencial primero y ampliar filtros, relaciones y opciones avanzadas solo cuando el usuario las solicita.

Este patrón coincide con las recomendaciones de SAP Fiori para separar listados de páginas de objeto, usar cabeceras con acciones y revelar contenido progresivamente. Para altas complejas o no lineales, Fiori recomienda un flujo guiado tipo wizard; aquí se aplicará solo cuando la dependencia de campos lo justifique.

### Backlog priorizado de esta auditoría

- **Alta:** rediseñar acciones de alta fuera de Movimientos para que sean barras contextuales compactas y coherentes.
- **Alta:** convertir formularios de cuentas, categorías, objetivos y repartos al modelo datos básicos → campos dependientes → opciones avanzadas.
- **Alta:** revisar todos los modales y migrar historiales/detalles a vistas internas o paneles laterales.
- **Media:** crear un sistema único de estados (éxito, error, aviso, guardando, vacío) con copy no técnico.
- **Media:** revisión visual pantalla por pantalla con una escala de densidad consistente y tamaños de control menores.
- **Baja:** permitir reorganizar widgets del Dashboard después de estabilizar el flujo principal.

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
- Historial remoto de migraciones reconciliado el 2026-09-08, incluida `supabase/migrations/20260831072000_investments.sql`.

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
