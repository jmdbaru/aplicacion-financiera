# Prompt definitivo — cierre de desarrollo de Aplicación Financiera

Actúa como un equipo senior compuesto por arquitecto de software, desarrollador React/TypeScript, desarrollador FastAPI/Python, especialista en PostgreSQL/Supabase, QA engineer, especialista en seguridad, UX/UI designer y product designer. Tu misión es auditar, consolidar, corregir y dejar preparada para producción esta aplicación financiera existente.

No reconstruyas el proyecto desde cero ni des por hecho que hay que repetir las fases ya realizadas. Primero inspecciona el repositorio y el estado real de la aplicación. Implementa las correcciones necesarias dentro del alcance, prueba cada cambio y documenta la evidencia. El objetivo es cerrar responsablemente la fase de desarrollo, no declarar terminado algo que todavía no se ha comprobado.

## 1. Contexto específico del proyecto

Este repositorio es un monorepo con esta estructura principal:

```text
apps/web/       React 19 + TypeScript + Vite 7 + Tailwind 4
apps/api/       FastAPI + Pydantic + Uvicorn
supabase/       PostgreSQL, Auth, RLS y migraciones SQL
docs/           arquitectura, seguridad, fases y mantenimiento
```

Antes de actuar, lee obligatoriamente:

- `PROMPT_MAESTRO_CODEX_APP_FINANCIERA.md`;
- `PROJECT_STATUS.md`;
- `PENDIENTES_PROYECTO.md`;
- `USER_ACTIONS.md`;
- `CHANGELOG.md`;
- `docs/architecture/overview.md`;
- `docs/architecture/database.md`;
- `docs/architecture/security.md`;
- `docs/phases/phase-12-product-consolidation.md`;
- los informes de las fases 7, 8, 9, 10 y 11.

El proyecto declara implementadas las fases técnicas 0 a 12. La fase actual es la consolidación de producto y la principal necesidad pendiente es la validación funcional guiada de módulos ya construidos. Respeta ese historial y no dupliques trabajo ya hecho sin evidencia de que esté incompleto o defectuoso.

El producto incluye, según el estado documentado, autenticación, perfiles y preferencias, dashboard, cuentas financieras, ledger de doble partida, ingresos, gastos, ajustes, transferencias, categorías, subcategorías, presupuestos, movimientos recurrentes, calendario, objetivos de ahorro, patrimonio, informes, importación CSV, reglas de categorización, inversiones y repartos.

## 2. Resultado esperado

Al finalizar debes dejar:

1. La aplicación visualmente coherente, sencilla, accesible y sin errores visibles.
2. Las funciones implementadas verificadas con casos reales o datos ficticios controlados.
3. Backend, frontend, Supabase, Auth, RLS y migraciones revisados.
4. Los informes funcionando correctamente por día, semana, mes y año.
5. Los objetivos útiles, claros y suficientemente motivadores sin gamificación molesta.
6. Las configuraciones comprensibles, flexibles y con valores por defecto sensatos.
7. Las categorías y subcategorías escalables, inspiradas en aplicaciones como Money Manager, sin convertir la app en un ERP complejo.
8. La arquitectura preparada para futuras funciones premium y permisos, sin bloquear ahora ninguna función.
9. El diagrama de flujo de la aplicación y el diagrama de base de datos actualizados.
10. Un informe final con evidencia, prioridades, riesgos, pendientes e ideas de alto valor.

## 3. Reglas de trabajo

- Abre primero el localhost real de la aplicación y haz una inspección visual antes de emitir conclusiones.
- Descubre el procedimiento de arranque leyendo `apps/web/package.json`, `apps/api/README.md` y la documentación existente. No presupongas que Node, Python o las dependencias están disponibles globalmente.
- Si el localhost no puede abrirse, documenta exactamente el bloqueo, continúa solo con comprobaciones válidas y no afirmes que has validado la interfaz.
- Preserva el trabajo existente. No borres migraciones, datos, pruebas ni documentos sin justificación y sin una alternativa reversible.
- No expongas secretos, claves privadas, tokens, contraseñas ni datos financieros reales.
- No ejecutes cambios destructivos en Supabase sin autorización y sin estrategia de recuperación.
- No introduzcas pagos todavía. Desarrolla todas las funcionalidades actuales y prepara únicamente la arquitectura de capacidades premium.
- No afirmes que una función funciona porque exista su botón, ruta, endpoint o componente. Debes probarla.
- Usa estas etiquetas en el informe: `VERIFICADO`, `OBSERVADO`, `INFERIDO`, `BLOQUEADO`.
- Clasifica los hallazgos como `P0 crítico`, `P1 importante` o `P2 mejora`.
- Si un problema está dentro del alcance y puedes corregirlo de forma segura, corrígelo, prueba la corrección y actualiza la documentación.
- Si una decisión es de producto y no puede deducirse con seguridad, presenta alternativas y recomienda una, sin ocultar el trade-off.

## 4. Fase A — inventario y arranque

1. Comprueba Git, estado del árbol de trabajo, rama, cambios pendientes y versión documentada.
2. Revisa toda la estructura del monorepo, dependencias, scripts, variables de entorno, lockfiles y workflows de CI.
3. Levanta o localiza el frontend y el backend según la configuración existente.
4. Abre el localhost en un navegador real y visita todas las secciones accesibles.
5. Registra errores del navegador, consola, red, API, servidor, Supabase y procesos.
6. Identifica qué módulos están visibles, cuáles están ocultos o en preview y cuáles solo existen en código.
7. Compara el estado real con `PROJECT_STATUS.md`, `PENDIENTES_PROYECTO.md` y `USER_ACTIONS.md`.

No vuelvas a ejecutar una fase técnica completa si ya está implementada. Crea, en su lugar, una matriz de cierre que indique qué está implementado, qué está validado, qué está pendiente y qué necesita corrección.

## 5. Fase B — auditoría visual y UX con Design Arc

Aplica el método Design Arc al recorrido real:

1. Define el objetivo de la revisión y el criterio de éxito.
2. Audita el recorrido actual desde el acceso hasta las tareas financieras principales.
3. Registra pantallas, pasos, estados materiales, fricciones y evidencia.
4. Propón la dirección recomendada y, cuando exista una decisión relevante, alternativas con sus ventajas y riesgos.
5. Valida la propuesta contra la implementación real, no solo contra capturas.
6. Revisa de nuevo las pantallas tras cada corrección visual.

Inspecciona en escritorio, móvil y tamaños intermedios:

- acceso, sesión, preferencias y menú de usuario;
- Inicio/Dashboard;
- Movimientos y alta rápida;
- Cuentas;
- Categorías;
- Presupuestos;
- Recurrentes y Calendario;
- Objetivos;
- Patrimonio;
- Informes;
- Importar y reglas;
- Inversiones;
- Repartos;
- estados vacíos, carga, error, éxito, sin permisos y datos no encontrados.

Revisa jerarquía visual, densidad, textos, iconografía, espaciado, contraste, foco de teclado, lectores de pantalla, objetivos táctiles, responsive, scroll, modales/paneles, confirmaciones y recuperación de errores.

Conserva las decisiones ya adoptadas cuando funcionen: alta rápida de movimientos, divulgación progresiva, patrón lista + detalle, acciones contextuales, scroll interno de listados, acciones principales claras, animaciones breves y respeto a `prefers-reduced-motion`. Si una decisión actual crea fricción, aporta evidencia antes de cambiarla.

## 6. Fase C — auditoría de backend y Supabase

Revisa `apps/api`, `apps/web/src`, las migraciones y los contratos entre capas.

Comprueba:

- excepciones y errores silenciosos;
- contratos API y estados HTTP;
- validación Pydantic y validación en base de datos;
- fechas, zonas horarias, monedas, decimales y redondeos;
- paginación, filtros, búsqueda y ordenación en servidor;
- consultas repetidas, N+1, índices y rendimiento;
- Auth, JWT, sesión, cierre, recuperación y aislamiento por usuario;
- `service_role`, claves publishable, variables de entorno y CORS;
- RLS en todas las tablas expuestas;
- políticas `SELECT`, `INSERT`, `UPDATE` y `DELETE` con `USING` y `WITH CHECK` correctos;
- vistas, RPC, triggers y funciones con permisos elevados;
- consistencia de migraciones locales y remotas;
- advisors de seguridad y rendimiento.

Comprueba el aislamiento con dos usuarios: ninguno puede leer, modificar, borrar o referenciar datos del otro. Comprueba también relaciones cruzadas en repartos, categorías, presupuestos, objetivos, patrimonio, importaciones e inversiones.

Mantén estas invariantes financieras:

- una transacción contabilizada tiene entradas compensadas y suma cero por moneda;
- una transferencia no es ingreso ni gasto;
- crear, editar, anular o revertir operaciones críticas es atómico;
- los saldos se derivan de la fuente de verdad correcta;
- el progreso de objetivos se deriva de aportaciones sin duplicar saldos;
- patrimonio neto = activos - pasivos;
- las importaciones pasan por staging, preview, validación, deduplicación y confirmación;
- los históricos se archivan o revierten, no se destruyen silenciosamente.

Si corriges el esquema, usa una migración SQL versionada, revisa los advisors y ejecuta una consulta o prueba posterior que demuestre el resultado. Atiende explícitamente los pendientes ya documentados: protección contra contraseñas filtradas, confirmación de email/SMTP antes de producción, exposición GraphQL, reconciliación de la migración de inversiones, limpieza de cuentas de prueba y cualquier diff remoto pendiente.

## 7. Fase D — matriz de funcionalidades

Crea una matriz con estas columnas:

`ID | Función | Ruta | Resultado esperado | Caso feliz | Error/vacío/carga | Permisos | Persistencia | Evidencia | Estado | Prioridad | Corrección | Prueba posterior`.

Como mínimo, prueba:

- registro, acceso, cierre, recuperación y preferencias;
- creación, edición, archivo, restauración y consulta de cuentas;
- ingreso, gasto, ajuste, transferencia y reverso;
- búsqueda, filtros, paginación y cambio de semana en Movimientos;
- categorías y subcategorías;
- presupuestos y compensación de reversos;
- recurrencias y generación sin duplicados;
- balance diario en Calendario;
- objetivos y aportaciones;
- patrimonio, activos, pasivos y valoraciones;
- informes y exportación CSV;
- importación CSV, preview, reglas, duplicados y confirmación;
- inversiones y valoraciones manuales;
- repartos, participantes, pagos e historial;
- configuración visual y preferencias regionales.

## 8. Fase E — informes por día, semana, mes y año

Revisa la implementación existente de `get_reports_overview`, el contrato FastAPI y `ReportsWorkspace`.

Los informes deben permitir como mínimo:

- periodo diario;
- periodo semanal;
- periodo mensual;
- periodo anual;
- navegación y selección clara del periodo;
- inicio y fin correctos según la zona horaria del usuario;
- ingresos, gastos, balance, comparativa y ranking de categorías;
- periodos sin actividad;
- categorías y subcategorías;
- transferencias excluidas de ingresos/gastos;
- reversos tratados de forma coherente;
- consistencia entre tarjetas, tablas, gráficos y CSV;
- rendimiento con volumen de datos;
- formato correcto de moneda, fecha y porcentajes.

Si actualmente solo existe un rango de fechas genérico, decide si basta con presets diarios/semanales/mensuales/anuales o si hace falta ampliar API, RPC y frontend. Implementa la solución coherente y prueba los límites: cambio de mes, cambio de año, semanas que cruzan meses, año bisiesto, zona horaria y ausencia de movimientos.

## 9. Fase F — objetivos funcionales y motivadores

Revisa `GoalsWorkspace`, `goals.ts`, sus esquemas, API, RPC y migraciones.

La experiencia debe permitir crear objetivos con nombre, importe o métrica, fecha, periodicidad y prioridad; registrar aportaciones; mostrar progreso derivado, restante, porcentaje, tendencia e historial; editar, pausar, reanudar, completar y archivar.

Propón y, si procede, implementa una capa ligera y opcional de motivación:

- hitos y celebraciones discretas;
- rachas o constancia solo cuando tengan sentido;
- progreso visual claro;
- recordatorios configurables y fáciles de desactivar;
- objetivos por etapas o recurrentes cuando aporten valor;
- tratamiento de atrasados, cancelados y sin actividad.

Evita culpa, presión artificial, notificaciones abusivas, competición innecesaria y gamificación que distraiga de las finanzas. Prueba el ciclo completo: crear, aportar, consultar, editar, pausar, completar, archivar y recuperar.

## 10. Fase G — configuraciones y categorías

Audita cada configuración que el usuario pueda elegir. Para cada una revisa propósito, nombre, ayuda, valor por defecto, dependencias, combinaciones inválidas, posibilidad de restaurar y lugar adecuado en la interfaz.

Mantén la libertad del usuario con divulgación progresiva: mostrar primero lo esencial y dejar opciones avanzadas bajo demanda. No expongas configuraciones técnicas que no aporten una decisión comprensible.

Para categorías, compara el modelo existente con Money Manager y otras aplicaciones actuales. Define una taxonomía inicial sencilla, con categorías base y dos o tres subcategorías útiles cuando proceda. Revisa específicamente que el modelo actual no limite artificialmente el crecimiento a una sola subcategoría si el producto necesita soportar más.

Debe existir una estrategia clara para:

- categorías globales y categorías personales;
- subcategorías con profundidad máxima razonable;
- nombres y colores/iconos consistentes;
- edición, archivo y restauración sin romper históricos;
- prevención de duplicados;
- movimientos sin categoría;
- presupuestos por categoría raíz;
- informes por categoría y subcategoría;
- futura creación de categorías personalizadas como posible capacidad premium.

No conviertas la administración de categorías en una pantalla de ERP ni bloquees ahora la funcionalidad por la futura monetización.

## 11. Fase H — preparación premium

Desarrolla todas las funciones actuales, pero prepara una arquitectura futura con:

- catálogo central de capacidades;
- planes y entitlements separados de la lógica de negocio;
- feature flags y límites configurables;
- autorización real en backend y base de datos;
- RLS compatible con futuras capacidades premium;
- interfaz preparada para comunicar límites sin ocultar estados importantes;
- migración segura de usuarios existentes;
- auditoría y pruebas de permisos.

No repartas condiciones `if premium` por todos los componentes. No integres pagos ahora y no uses ocultación visual como única seguridad.

## 12. Investigación de mercado

Investiga aplicaciones actuales de finanzas personales, presupuestos, objetivos y gestión de hábitos. Incluye Money Manager y varias alternativas relevantes.

Para cada referencia documenta:

`Aplicación | Función/patrón | Fuente | Ventaja | Riesgo | Adaptación a esta app | Decisión`.

Usa fuentes actuales y enlaces verificables. No copies interfaces ni afirmes que una función es buena solo porque otra aplicación la utiliza. Explica qué patrón aporta valor a este producto y qué complejidad introduce.

## 13. Diagramas y documentación

Crea en Miro, si la integración está disponible y autorizada:

### Diagrama de flujo de la aplicación

Incluye autenticación, onboarding, Inicio, alta de movimiento, cuentas, categorías, presupuestos, recurrentes, calendario, objetivos, patrimonio, informes, importación, inversiones, repartos, configuración, permisos, errores y recuperación.

Marca decisiones, rutas alternativas, datos leídos/escritos y límites entre frontend, API y Supabase.

### Diagrama de base de datos

Incluye tablas reales, campos relevantes, PK, FK, cardinalidades, índices, RLS, vistas, RPC, triggers, usuario propietario, relaciones del ledger, categorías, presupuestos, objetivos, patrimonio, importaciones, inversiones y repartos.

Los nombres deben coincidir con el código y las migraciones. No incluyas secretos ni datos personales. Añade fecha, versión, leyenda y marca de elementos confirmados o pendientes.

Guarda también una versión portable en el repositorio, preferiblemente Mermaid o una especificación Markdown, porque Miro no debe ser la única fuente mantenible.

## 14. Corrección y validación

Prioriza así:

- `P0`: pérdida/corrupción de datos, acceso entre usuarios, fallo de autenticación o bloqueo de una función esencial.
- `P1`: fallo funcional relevante, cálculo financiero incorrecto, inconsistencia de datos, error recurrente de UX o riesgo técnico importante.
- `P2`: mejoras visuales, rendimiento no crítico, documentación y mejoras futuras.

Después de cada cambio:

1. ejecuta lint, typecheck, tests y build aplicables;
2. vuelve a abrir el localhost;
3. repite el flujo afectado;
4. revisa consola, red, logs y persistencia;
5. revisa permisos y regresiones;
6. actualiza la matriz y la documentación.

Ejecuta, cuando estén disponibles:

```powershell
# Web
npm ci
npm run check
npm run build

# API
python -m pip install -e ".[dev]"
pytest
ruff check .
```

Si Node no está instalado globalmente, usa el runtime autorizado o la CI existente. No instales software externo sin autorización y no declares fallida la aplicación por una limitación del entorno si el build ya está validado en CI; documenta la diferencia.

## 15. Informe final obligatorio

Entrega un informe con esta estructura:

```text
# Informe de cierre de desarrollo — Aplicación Financiera

## 1. Veredicto
LISTO / LISTO CON PENDIENTES / NO LISTO / BLOQUEADO

## 2. Entorno y evidencia
Commit, rama, localhost, navegador, viewport, usuario de prueba, fecha y limitaciones.

## 3. Estado por módulo
Auth, Inicio, Movimientos, Cuentas, Categorías, Presupuestos, Recurrentes, Calendario,
Objetivos, Patrimonio, Informes, Importación, Inversiones, Repartos y Configuración.

## 4. Hallazgos P0
ID, problema, impacto, evidencia, corrección y estado.

## 5. Hallazgos P1
Misma estructura.

## 6. Hallazgos P2 y mejoras futuras
Valor, esfuerzo, dependencia y recomendación.

## 7. Frontend, UX y Design Arc
Recorridos, estados, responsive, accesibilidad, decisiones y veredicto.

## 8. Backend, Supabase y seguridad
API, RLS, Auth, migraciones, RPC, índices, advisors, riesgos y bloqueos.

## 9. Informes
Validación diaria, semanal, mensual y anual, límites y resultados.

## 10. Objetivos, configuraciones y categorías
Decisiones, cambios, pruebas y pendientes.

## 11. Preparación premium
Capacidades, permisos, flags y límites futuros.

## 12. Investigación de mercado
Fuentes, patrones y decisiones adoptadas.

## 13. Diagramas
Referencias Miro y archivos portables.

## 14. Cambios implementados
Archivos, migraciones, pruebas y posibles regresiones.

## 15. Pendientes y acciones del usuario
No pedir secretos. Mantener `USER_ACTIONS.md` actualizado.

## 16. Ideas adicionales de alto valor
Solo ideas justificadas y separadas de las correcciones necesarias.

## 17. Checklist final
Cada punto con PASS / FAIL / BLOCKED y evidencia.
```

Actualiza `PROJECT_STATUS.md`, `PENDIENTES_PROYECTO.md`, `USER_ACTIONS.md`, `CHANGELOG.md` y el informe de fase correspondiente. No crees listas paralelas de pendientes.

## 16. Criterio de cierre

Solo puedes declarar `LISTO` cuando:

- el localhost ha sido revisado visualmente;
- no hay P0 abiertos;
- las funciones esenciales tienen evidencia real;
- las fases 7 a 12 han sido validadas o sus bloqueos están documentados;
- los informes diario, semanal, mensual y anual están comprobados;
- objetivos, configuraciones y categorías tienen una decisión de producto clara;
- Auth, RLS, ledger, migraciones y aislamiento de usuarios han sido comprobados;
- los diagramas de flujo y base de datos están actualizados;
- el build, lint, tipos y pruebas aplicables son correctos;
- los pendientes previos a producción están identificados y asignados;
- ninguna afirmación del informe carece de evidencia o etiqueta de incertidumbre.

Si quedan P1 o acciones externas, usa `LISTO CON PENDIENTES`, nunca `LISTO`. Empieza ahora leyendo la documentación indicada y abriendo el localhost real.
