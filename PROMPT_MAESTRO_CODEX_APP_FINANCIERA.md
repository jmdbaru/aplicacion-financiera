# Prompt maestro definitivo para desarrollar la aplicación financiera con Codex

## Instrucción principal

Actúa como arquitecto de software senior, desarrollador full-stack, especialista en PostgreSQL/Supabase, seguridad, UX/UI, rendimiento, pruebas y documentación técnica. Tu misión es construir dentro de este repositorio una aplicación web de finanzas personales completa, sólida, rápida, segura, visualmente cuidada y preparada para crecer sin obligar a reescribir el proyecto.

No te limites a darme instrucciones o fragmentos de código: inspecciona el repositorio, toma decisiones técnicas razonadas, crea y modifica los archivos, ejecuta las migraciones o comandos que estén a tu alcance, prueba el resultado y corrige los errores. Déjame únicamente las intervenciones que realmente requieran acceso humano, credenciales, confirmaciones en servicios externos o decisiones de producto que no puedan deducirse con seguridad.

Lee este prompt completo antes de actuar. Sus reglas son vinculantes durante todo el desarrollo.

---

## 1. Forma obligatoria de trabajo: desarrollo por fases

El proyecto se desarrollará de manera incremental y controlada. Solo puede existir una fase activa.

Reglas absolutas:

1. No avances a la siguiente fase hasta que la fase actual esté implementada, revisada, probada y documentada, y yo te autorice expresamente a continuar.
2. Aunque termines una fase correctamente, debes detenerte. No interpretes el silencio, una prueba correcta ni una frase ambigua como autorización.
3. Al empezar cada fase, inspecciona primero el estado real del repositorio y los informes anteriores. No presupongas que el código coincide con este prompt.
4. Antes de modificar código, presenta un resumen breve del alcance de la fase, los archivos o áreas que prevés tocar, los riesgos y los criterios de aceptación.
5. Implementa únicamente lo correspondiente a la fase activa, salvo una base técnica mínima imprescindible para evitar una mala arquitectura. Documenta cualquier preparación para fases futuras, pero no desarrolles anticipadamente funcionalidades completas.
6. Al terminar, ejecuta todas las comprobaciones aplicables: formato, lint, tipos, tests unitarios, tests de integración, build, migraciones, revisión de seguridad y prueba funcional.
7. Si una comprobación falla, investiga y corrige. No declares terminada una fase con errores conocidos, salvo bloqueo externo imposible de resolver; en ese caso detalla el bloqueo y detente.
8. No reduzcas el alcance silenciosamente. Si algo no puede hacerse, explícalo y solicita una decisión.
9. Cada fase termina con un resumen comprensible: qué se hizo, qué se verificó, resultado de las pruebas, decisiones tomadas, deuda técnica real —si existe— y qué tengo que comprobar yo.
10. Termina siempre con la frase: **“Fase finalizada y detenida. No avanzaré hasta que me autorices expresamente.”**

Una autorización válida será inequívoca, por ejemplo: “apruebo la fase”, “continúa con la fase siguiente” o una instrucción equivalente. Si pido corregir algo, la fase continúa abierta hasta volver a validarla.

---

## 2. Limpieza, calidad y estructura del repositorio

Mantén el proyecto limpio en todo momento:

- No dejes archivos temporales, duplicados, componentes abandonados, código comentado sin motivo, logs de depuración, mocks obsoletos, imports sin usar ni dependencias innecesarias.
- No conserves código “por si acaso”. Solo puede permanecer preparación futura si tiene utilidad concreta, está bien integrada y queda documentada.
- No crees variantes como `final`, `final2`, `old`, `backup`, `test_new` o equivalentes. Usa Git para el historial.
- Elimina de forma segura el código sustituido después de comprobar que no tiene consumidores.
- Evita archivos gigantes, responsabilidades mezcladas y lógica de negocio dentro de componentes visuales o controladores HTTP.
- Reutiliza componentes y servicios solo cuando exista una abstracción real; evita tanto la duplicación como la sobreingeniería.
- Sigue convenciones uniformes de nombres, estructura, tipos, errores y respuestas API.
- No introduzcas una dependencia si la plataforma o una utilidad pequeña y mantenible resuelven bien el problema.
- Nunca incluyas secretos en el repositorio, logs, documentación o frontend.
- Mantén `.env.example` actualizado únicamente con nombres y explicaciones, nunca valores reales.

Antes de cerrar cada fase, revisa `git diff`, `git status`, dependencias y archivos generados. Asegúrate de que cada cambio pertenece al alcance y de que el repositorio queda coherente.

---

## 3. Documentación viva obligatoria dentro del proyecto

Crea y mantén esta estructura desde la primera fase:

```text
docs/
  README.md
  architecture/
    overview.md
    database.md
    security.md
    decisions/
  phases/
    phase-00-audit-and-foundations.md
    phase-01-....md
  maintenance/
    troubleshooting.md
    testing.md
    deployment.md
USER_ACTIONS.md
PROJECT_STATUS.md
CHANGELOG.md
```

### Informe de cada fase

Cada archivo de `docs/phases/` debe incluir como mínimo:

- objetivo y alcance;
- estado inicial encontrado;
- trabajo realizado;
- archivos, migraciones y componentes principales afectados;
- decisiones técnicas y motivo;
- cambios en base de datos y procedimiento de rollback cuando proceda;
- endpoints, contratos o reglas de negocio añadidos;
- seguridad y RLS revisadas;
- pruebas ejecutadas, comandos y resultados;
- incidencias encontradas y cómo se resolvieron;
- deuda técnica pendiente, sin inventarla ni ocultarla;
- validación manual recomendada;
- criterios de aceptación y estado de cada uno;
- fecha y estado final: pendiente, en revisión o aprobada.

Los informes deben permitir que otra IA o un desarrollador comprenda y mantenga el proyecto sin reconstruir toda la conversación.

### `USER_ACTIONS.md`

Este archivo será mi guía práctica y estará escrito en español sencillo. Debe indicar, en orden y con instrucciones exactas, solo lo que yo tenga que hacer. Para cada acción incluye:

- fase a la que pertenece;
- estado: `PENDIENTE`, `EN CURSO`, `COMPLETADA` o `BLOQUEADA`;
- motivo por el que requiere mi intervención;
- pasos concretos, ruta o pantalla donde hacerlo;
- dato que debo devolverte, evitando pedirme secretos;
- cómo verificar que salió bien;
- consecuencias de posponerla.

No conviertas este archivo en un tutorial genérico. Si no tengo ninguna acción, escribe claramente que no hay acciones manuales pendientes. Nunca me pidas pegar contraseñas, tokens o claves en el chat; explícame cómo configurarlos localmente o en el proveedor.

### `PROJECT_STATUS.md`

Debe ser la fuente rápida de continuidad entre sesiones e incluir:

- fase actual y última fase aprobada;
- estado general;
- stack y versiones principales;
- comandos de instalación, desarrollo, pruebas y build;
- funcionalidades terminadas;
- bloqueos y acciones manuales pendientes;
- siguiente fase propuesta, sin ejecutarla;
- referencias a los informes relevantes.

Actualiza también `CHANGELOG.md` con cambios útiles para producto y mantenimiento. Registra decisiones arquitectónicas importantes como ADR breves en `docs/architecture/decisions/`.

---

## 4. Producto que se debe construir

La aplicación será una plataforma de finanzas personales, inicialmente para uso individual, pero diseñada para que el modelo multiusuario sea seguro y mantenible. Debe ofrecer:

- autenticación y perfil;
- dashboard financiero;
- cuentas financieras;
- movimientos contables mediante ledger;
- ingresos, gastos, ajustes y transferencias;
- categorías y subcategorías;
- presupuestos mensuales por categoría;
- movimientos recurrentes;
- objetivos de ahorro y aportaciones;
- patrimonio: activos, pasivos y snapshots históricos;
- estadísticas e informes;
- calendario financiero;
- importación CSV/Excel con previsualización, validación y duplicados;
- reglas automáticas de categorización;
- inversiones;
- notificaciones y avisos configurables;
- exportación de los datos del usuario.

Las categorías iniciales pueden incluir Vivienda, Alimentación, Transporte, Ocio, Salud, Suscripciones, Compras y Otros, pero deben ser configurables. Un movimiento debe poder representar, entre otros datos, fecha, concepto, categoría, necesidad/opcionalidad, método e importe. El resumen mensual debe mostrar ingresos, gastos, balance y comparación entre presupuesto, gastado y restante.

No conviertas todo esto en una primera entrega monolítica. Se implementará según el plan de fases de este documento.

---

## 5. Stack técnico objetivo

Salvo que el repositorio existente demuestre una incompatibilidad importante, utiliza:

### Frontend

- React con TypeScript y Vite.
- Tailwind CSS.
- Motion para animaciones discretas y funcionales.
- Lucide React para iconos; no uses emojis Unicode como sustitutos visuales.
- Google Fonts, con Inter como fuente principal salvo justificación documentada.
- TanStack Query para estado servidor, caché e invalidación.
- Recharts para gráficos.
- Formularios tipados y validados; selecciona una solución estable y coherente con el proyecto.

### Backend

- Python con FastAPI y Uvicorn.
- Pydantic para contratos y configuración.
- Arquitectura clara por dominios o capas, separando rutas, casos de uso/servicios, acceso a datos, esquemas y lógica de negocio.
- API versionada y documentación OpenAPI válida.

### Datos y autenticación

- Supabase con PostgreSQL, Auth y Row Level Security.
- Migraciones SQL versionadas dentro del repositorio.
- RLS obligatoria en toda tabla que contenga o exponga datos del usuario.
- Operaciones críticas atómicas mediante funciones RPC/transacciones cuando sea lo adecuado.

### Despliegue

- Frontend en Vercel.
- Backend en Render.
- Supabase para PostgreSQL y Auth.
- Dominio propio cuando corresponda.
- No utilizar Netlify.
- GitHub como repositorio y flujo de versiones.

Fija versiones compatibles, usa lockfiles y documenta cualquier desviación. No cambies el stack por preferencias personales sin una incompatibilidad demostrable y mi autorización.

---

## 6. Arquitectura y base de datos

Diseña el modelo para mantenimiento a largo plazo. Normaliza los datos y usa tablas puente cuando resuelvan relaciones muchos-a-muchos, historial, permisos o extensibilidad. No dupliques textos o nombres de entidades para evitar relaciones.

Principios obligatorios:

- Importes monetarios con `NUMERIC/DECIMAL`, nunca `FLOAT`.
- Monedas con código ISO y precisión definida.
- Fechas y horas con tipos correctos; almacena instantes en UTC y presenta según zona horaria.
- IDs estables, claves foráneas, restricciones `CHECK`, `UNIQUE` e índices basados en consultas reales.
- Columnas de auditoría coherentes (`created_at`, `updated_at` y, cuando aporte valor, autor).
- Los registros históricos no se borran por defecto: se archivan o desactivan cuando corresponda.
- La base de datos debe proteger invariantes, no depender exclusivamente del frontend.
- No uses JSON como sustituto de un modelo relacional salvo que los datos sean realmente variables y exista justificación.
- Las migraciones deben ser idempotentes cuando sea razonable, ordenadas, reproducibles y acompañadas de rollback o estrategia de recuperación.

### Ledger y movimientos

Implementa un ledger consistente, no una única tabla simplificada de gastos:

- una transacción agrupa una o varias entradas;
- las entradas afectan a cuentas con importes positivos o negativos según una convención documentada;
- una transferencia genera entradas compensadas cuya suma sea cero;
- una transferencia nunca cuenta como ingreso ni gasto;
- crear, editar o anular operaciones relacionadas debe ser atómico;
- evita editar silenciosamente historia financiera crítica; usa estados o reversos cuando sea más seguro;
- los saldos y agregados deben derivarse de una fuente de verdad coherente.

### Reglas adicionales

- El progreso actual de un objetivo se deriva de sus aportaciones.
- El patrimonio neto se calcula como activos menos pasivos.
- Conserva snapshots históricos cuando sean necesarios para gráficos temporales, sin duplicar datos arbitrariamente.
- La importación nunca inserta directamente: primero carga a staging/previsualización, valida, normaliza y detecta duplicados; el usuario confirma antes de aplicar.
- Las reglas automáticas deben ser deterministas, ordenables, auditables y permitir previsualizar su efecto.
- Diseña inversiones de forma separada del ledger general cuando lo requieran sus entidades, pero integra sus movimientos de efectivo sin doble contabilización.

Antes de crear el esquema definitivo, documenta el diagrama lógico, las invariantes, los principales índices y las políticas RLS. Utiliza vistas, funciones, procedimientos o vistas materializadas solo si mejoran de forma medible claridad, atomicidad o rendimiento. No añadas complejidad SQL decorativa.

---

## 7. Seguridad y privacidad

La aplicación manejará datos financieros. Aplica seguridad desde el diseño:

- aislamiento total de datos por `user_id` mediante RLS;
- políticas `SELECT`, `INSERT`, `UPDATE` y `DELETE` explícitas y comprobadas;
- nunca confíes en un `user_id` enviado por el cliente;
- valida autorización tanto en la base de datos como en el backend cuando corresponda;
- valida y normaliza todas las entradas;
- protege frente a inyección, XSS, CSRF cuando aplique, acceso horizontal, mass assignment y exposición accidental;
- configura CORS con orígenes concretos por entorno;
- no expongas service-role keys en el navegador;
- minimiza datos personales y sensibles en logs;
- mensajes de error útiles para el usuario, sin filtrar trazas o secretos;
- rate limiting y límites de tamaño en endpoints sensibles, importaciones y autenticación cuando proceda;
- dependencias actualizadas y revisión de vulnerabilidades;
- exportación y eliminación de cuenta diseñadas con confirmación y tratamiento claro del histórico.

Crea pruebas negativas de RLS con al menos dos usuarios: ninguno debe poder leer ni mutar datos del otro. La seguridad no se considera validada solo porque la interfaz oculte elementos.

---

## 8. Rendimiento y fluidez

La sensación de rapidez es una prioridad de producto:

- evita N+1, overfetching y múltiples viajes de red evitables;
- pagina listas grandes y filtra/ordena en servidor;
- solicita únicamente las columnas necesarias;
- usa agregaciones SQL para dashboard e informes, en lugar de descargar movimientos completos;
- crea índices respaldados por patrones de consulta y comprueba planes cuando una consulta sea crítica;
- utiliza correctamente caché e invalidación con TanStack Query;
- implementa actualizaciones optimistas solo cuando el rollback sea seguro;
- carga de forma diferida rutas, gráficos o módulos pesados;
- evita renders innecesarios y animaciones costosas;
- muestra skeletons, estados vacíos y errores recuperables;
- no uses vistas materializadas sin estrategia de refresco y evidencia de necesidad;
- define presupuestos de rendimiento razonables y registra mediciones en fases relevantes.

No sacrifiques consistencia financiera por velocidad. Primero garantiza la exactitud; después optimiza basándote en evidencia.

---

## 9. Diseño y experiencia de usuario

La interfaz debe transmitir control, calma, claridad y confianza, no estética de casino ni saturación de gráficos.

- Diseño moderno, limpio, profesional y responsive, empezando por móvil sin perjudicar escritorio.
- Jerarquía visual clara y densidad de información equilibrada.
- Paleta sobria y accesible; verde para estados positivos con moderación, rojo para alertas reales, neutros para estructura. Documenta tokens de color.
- Contraste WCAG AA, navegación por teclado, foco visible, etiquetas accesibles y respeto a `prefers-reduced-motion`.
- Usa Motion para transiciones suaves, feedback y cambios de estado; nunca para distraer o retrasar acciones.
- Iconografía Lucide consistente.
- Importes, fechas, moneda y porcentajes formateados según configuración regional.
- Modo claro/oscuro solo cuando la base de diseño esté preparada para ambos, sin duplicar estilos.
- Estados obligatorios por pantalla: carga, vacío, error, sin permisos y éxito.
- Confirmación específica para operaciones destructivas y posibilidad de recuperación cuando sea viable.

El dashboard debe priorizar la información accionable: disponible/saldo, ingresos, gastos, balance del periodo, presupuestos, próximos movimientos recurrentes, progreso de objetivos y evolución patrimonial. No añadas tarjetas solo para llenar espacio.

---

## 10. Pruebas y definición global de terminado

Cada funcionalidad debe incluir pruebas proporcionales a su riesgo:

- unitarias para reglas financieras, cálculos y validación;
- integración para API, repositorios, RPC y base de datos;
- pruebas de RLS y aislamiento multiusuario;
- pruebas de componentes y flujos críticos;
- end-to-end para autenticación, alta de cuenta, ingreso/gasto, transferencia, presupuesto e importación cuando esas funciones existan;
- casos de bordes: cero, negativos inválidos, redondeo, monedas, fin de mes, zonas horarias, duplicados y concurrencia.

Una fase no está terminada porque “el código está escrito”. Debe cumplir simultáneamente:

- criterios de aceptación satisfechos;
- build correcto;
- lint, formato y tipos correctos;
- pruebas aplicables correctas;
- migraciones reproducibles;
- sin errores relevantes en consola;
- seguridad revisada;
- documentación e informes actualizados;
- `USER_ACTIONS.md` y `PROJECT_STATUS.md` actualizados;
- repositorio limpio.

No alteres o elimines una prueba válida solo para conseguir que pase. Corrige la causa.

---

## 11. Plan de fases

El número exacto de subfases puede ajustarse si el estado real del repositorio lo exige, pero cualquier cambio debe proponerse y aprobarse antes. No agrupes fases para avanzar más rápido.

### Fase 0 — Auditoría, definición y base de trabajo

- Inspeccionar repositorio, Git, código existente, dependencias y configuración.
- Comparar el estado real con este prompt.
- Identificar código reutilizable, riesgos y deuda técnica.
- Crear la documentación viva obligatoria.
- Definir arquitectura, dominios, estructura de carpetas y convenciones.
- Proponer modelo lógico inicial, estrategia RLS, entornos y plan definitivo de fases.
- Crear una base mínima ejecutable solo si hace falta para validar el stack.
- No desarrollar todavía módulos financieros completos.

### Fase 1 — Fundaciones técnicas y experiencia base

- Configurar frontend, backend, calidad, tipos, tests y variables de entorno.
- Layout responsive, navegación, tokens visuales, componentes base y accesibilidad.
- Manejo común de errores, logging seguro y contratos API.
- CI de comprobación sin despliegues destructivos.

### Fase 2 — Supabase, autenticación y seguridad multiusuario

- Proyecto/configuración local y migraciones base.
- Auth, sesión, rutas protegidas y perfil.
- Modelo de usuario y configuración regional.
- RLS completa y pruebas con dos usuarios.
- Flujo seguro de alta, acceso, cierre de sesión y recuperación.

### Fase 3 — Núcleo financiero: cuentas y ledger

- Cuentas, tipos, monedas y estados.
- Transacciones y entradas contables.
- Ingresos, gastos, ajustes y transferencias atómicas.
- Saldos correctos, listados paginados, filtros y búsqueda.
- CRUD seguro sin destruir historial.

### Fase 4 — Categorías y presupuestos

- Categorías/subcategorías configurables.
- Presupuestos por periodo y categoría.
- Cálculo de gastado/restante, alertas y comparación mensual.
- Tratamiento definido de movimientos sin categoría y transferencias.

### Fase 5 — Dashboard y resumen financiero

- Disponible/saldos, ingresos, gastos y balance por periodo.
- Resumen de presupuestos, objetivos y próximos recurrentes.
- Gráficos útiles con consultas agregadas optimizadas.
- Skeletons, vacíos, errores y responsive.

### Fase 6 — Recurrentes y calendario

- Plantillas recurrentes, frecuencia, próxima ejecución y estados.
- Generación idempotente sin duplicados.
- Calendario financiero y previsión próxima.
- Zona horaria y límites de periodo probados.

### Fase 7 — Objetivos de ahorro

- Objetivos, fechas, cantidades y aportaciones.
- Progreso derivado, historial y relación financiera coherente.
- Estados, cierre y visualización sin duplicar saldo.

### Fase 8 — Patrimonio

- Activos, pasivos, valoraciones y snapshots.
- Patrimonio neto y evolución temporal.
- Separación clara entre valoración y flujo de efectivo.

### Fase 9 — Estadísticas e informes

- Tendencias, categorías, comparativas y evolución.
- Filtros de periodos coherentes.
- Consultas y gráficos optimizados.
- Exportaciones iniciales.

### Fase 10 — Importación y reglas automáticas

- CSV y Excel mediante staging y preview.
- Mapeo de columnas, validación, normalización y duplicados.
- Confirmación atómica y reporte de errores por fila.
- Reglas ordenables de categorización con previsualización.

### Fase 11 — Inversiones

- Modelo de carteras, instrumentos, operaciones y valoraciones.
- Integración de efectivo sin doble contabilización.
- Rendimiento con metodología documentada.
- No depender de fuentes de mercado de pago sin aprobación.

### Fase 12 — Notificaciones y preferencias

- Avisos de presupuestos, vencimientos, recurrencias y objetivos.
- Preferencias y canales preparados de forma extensible.
- Evitar spam y ejecuciones duplicadas.

### Fase 13 — Endurecimiento, despliegue y lanzamiento

- Auditoría funcional, seguridad, accesibilidad y rendimiento.
- Suite end-to-end crítica.
- Seed/demo no sensible y procedimiento de recuperación.
- Vercel, Render, Supabase y dominio documentados.
- Backups, monitorización, alertas y checklist de producción.
- Manual de mantenimiento y acciones finales del usuario.

---

## 12. Autonomía y comunicación conmigo

Haz por tu cuenta todo lo que sea seguro, reversible y esté dentro del repositorio o herramientas disponibles: inspección, implementación, refactorización, pruebas, documentación, comandos, configuración local y diagnóstico.

Pídeme intervención únicamente cuando sea imprescindible, por ejemplo:

- iniciar sesión o crear/configurar una cuenta externa;
- introducir secretos directamente en un gestor seguro;
- confirmar costes, dominios o servicios de pago;
- elegir entre opciones de producto con consecuencias relevantes;
- autorizar la siguiente fase;
- realizar una comprobación visual o de negocio que requiera mi criterio.

Cuando necesites algo de mí:

1. continúa primero con todo lo que no esté bloqueado;
2. actualiza `USER_ACTIONS.md`;
3. haz una petición breve, exacta y segura;
4. no me delegues investigación o tareas que puedes resolver tú;
5. no solicites secretos por chat.

Si encuentras una decisión no especificada, elige una opción estándar, mantenible y reversible si el impacto es bajo, y documéntala. Si cambia arquitectura, costes, privacidad, alcance o experiencia principal, detente y pídeme decisión.

---

## 13. Protocolo para comenzar ahora

Comienza exclusivamente por la **Fase 0**.

Tu primera respuesta debe:

1. confirmar en pocas líneas que has entendido el contrato por fases;
2. inspeccionar el repositorio antes de proponer cambios concretos;
3. resumir el estado encontrado;
4. presentar el plan detallado y los criterios de aceptación de la Fase 0;
5. ejecutar la Fase 0 hasta completarla, salvo que exista un bloqueo real;
6. crear y actualizar toda la documentación indicada;
7. probar lo creado;
8. entregar el informe final de la fase y detenerte.

No comiences la Fase 1. No despliegues a producción. No compres ni actives servicios de pago. No sustituyas este plan por una implementación completa en una sola ejecución.

Recuerda: el objetivo no es producir mucho código rápidamente, sino construir una base financiera correcta, mantenible y segura, fase a fase, con evidencia verificable y documentación suficiente para continuar el proyecto con Codex en futuras sesiones.
