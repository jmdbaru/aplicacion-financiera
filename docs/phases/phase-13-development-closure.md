# Informe de cierre de desarrollo — Aplicación Financiera

Fecha: 2026-09-08 · Rama: `main` · Commit de partida: `3ffbca96ac1a3cdd4ee2011b4fbd1f127492e421`.

## 1. Veredicto

**LISTO CON PENDIENTES.** No existe un P0 verificado. Las correcciones locales, remotas y las suites automáticas están correctas, pero no es responsable declarar `LISTO`: falta un recorrido autenticado con datos ficticios y los controles de producción de Supabase.

## 2. Entorno y evidencia

- `VERIFICADO`: Vite en `http://127.0.0.1:5173/`, FastAPI en `http://127.0.0.1:8000`; health devuelve `{"status":"ok","environment":"local"}`.
- `VERIFICADO`: navegador in-app a 987 × 912; acceso sin scroll de documento ni errores/avisos de consola.
- `VERIFICADO`: ESLint y TypeScript correctos; 20 pruebas web, Ruff y 31 pruebas API correctas; build de Vite correcto.
- `VERIFICADO PARCIAL`: sesión ya autenticada en localhost, sin crear, editar, exportar ni revelar datos: Informes carga y sus controles Día, Semana, Mes, Año y rango personalizado responden; Objetivos carga los estados y su formulario ofrece prioridad y frecuencia.
- `VERIFICADO`: el panel del proyecto correcto permitió aplicar las correcciones de Informes y Objetivos. Se confirmaron columnas, restricción `paused`, índice y funciones `SECURITY INVOKER`, ejecutables por `authenticated` y no por `anon`, sin consultar datos de usuarios.
- `VERIFICADO`: las 30 versiones locales y remotas de migración se reconciliaron sin reejecutar DDL.

## 3. Estado por módulo

| Módulo | Estado |
|---|---|
| Auth, Inicio, Movimientos, Cuentas, Categorías, Presupuestos, Recurrentes, Calendario y Repartos | `INFERIDO` por código y pruebas; recorrido autenticado pendiente. |
| Objetivos | `VERIFICADO` en unidades y tipos para prioridad, periodicidad, edición, pausa/reanudación e historial; UI autenticada carga estados y el formulario presenta prioridad/frecuencia. El esquema remoto está aplicado; persisten la reconciliación y las mutaciones de prueba. |
| Informes | `VERIFICADO` en unidades para día, semana, mes, año, semana entre meses y año bisiesto; UI autenticada comprobada en los cuatro periodos y rango personalizado. La función remota está aplicada; persiste la reconciliación. |
| Patrimonio, Importación e Inversiones | `INFERIDO`; implementados y con pruebas cliente, aún sin recorrido autenticado. |
| Configuración | `INFERIDO`; sin una sesión no se comprobó persistencia visual ni regional. |

## 4. Hallazgos P0

Ninguno `VERIFICADO`.

## 5. Hallazgos P1

- **P1-01, corregido localmente:** Informes no ofrecía selección ni navegación diaria, semanal, mensual o anual. Se añadieron periodos normalizados, navegación y un rango personalizado opcional.
- **P1-02, corregido localmente:** Objetivos no podía editarse, pausarse ni reanudarse, ni expresar prioridad o ritmo. Se añadieron esos campos sin convertirlos en notificaciones automáticas.
- **P1-03, corregido remoto:** las migraciones `20260908110000`, `20260908110100` y `20260908110200` se ejecutaron y sus invariantes se comprobaron en Supabase. La última repone el permiso necesario para que Presupuestos y Resumen normalicen periodos. Su trazabilidad quedó reconciliada con el historial remoto.

## 6. Hallazgos P2 y mejoras futuras

- La carga diferida y separación de dependencias reducen el chunk principal de 736.77 kB a 64.36 kB minificado; React (112.42 kB gzip) y Supabase (57.32 kB gzip) quedan cacheables. Medir navegación real antes de más divisiones.
- Exponer Patrimonio, Importación e Inversiones solo después del recorrido funcional autenticado, ya que hoy están preparados en código pero ocultos en navegación.

## 7. Frontend, UX y Design Arc

Objetivo: una revisión calmada y clara del acceso y de las rutas financieras principales. Evidencia activa: **solo guías**, modo **totalmente automático**, guardada en `.codex/design-arc.yaml`.

Dirección adoptada: conservar el shell existente, usar controles de periodo visibles y etiquetados, y ocultar la personalización de fechas bajo demanda. La pantalla de acceso usa controles nativos y etiquetas visibles, coherente con la [guía de formularios de W3C](https://www.w3.org/WAI/tutorials/forms/).

`VERIFICADO`: acceso desktop, etiquetas, ausencia de scroll y consola limpia. `BLOQUEADO`: pantalla autenticada, móvil y lectores de pantalla necesitan una sesión y dispositivos/tecnologías de apoyo reales.

## 8. Backend, Supabase y seguridad

- `VERIFICADO`: API health, Ruff y 31 pruebas.
- `INFERIDO`: RLS, RPC y seguridad de relaciones desde migraciones locales.
- `VERIFICADO`: advisors remotos sin errores; 34 avisos corresponden a objetos públicos visibles por GraphQL para `authenticated`.
- `BLOQUEADO`: aislamiento actual entre dos usuarios, decisión/mitigación de GraphQL, SMTP/confirmación de correo, protección de contraseñas comprometidas y reconciliación del historial de inversiones y del cierre.

## 9. Informes

Los presets calculan rangos locales de día, semana de lunes a domingo, mes y año; las pruebas cubren 29/02 y el cruce marzo–abril. La API/RPC conserva rangos inclusivos y excluye transferencias al limitarse a ingresos y gastos. Persistencia remota y exportación autenticada: `BLOQUEADO`.

## 10. Objetivos, configuraciones y categorías

Decisión: objetivo monetario como fuente de verdad; prioridad y frecuencia son opcionales, y el historial muestra una señal factual de los últimos 30 días sin rachas, presión ni notificaciones. Las categorías admiten múltiples subcategorías de primer nivel; esta profundidad se mantiene como límite razonable para una app personal. La migración nueva conserva la raíz y subcategoría en informes.

## 11. Preparación premium

`P2 / INFERIDO`: no se introdujeron pagos ni una ocultación visual. Antes de planes reales se requiere un catálogo de capacidades y entitlements en servidor/BD, con autorización y RLS, no condiciones dispersas de frontend. Es una decisión de arquitectura pendiente, no una afirmación de protección actual.

## 12. Investigación de mercado

| Referencia | Patrón | Decisión |
|---|---|---|
| [Money Manager](https://help.realbyteapps.com/hc/en-us/sections/360007305713-Getting-started) | presupuestos configurables y carry-over | Mantener categorías y presupuestos sencillos; no replicar su interfaz. |
| [YNAB](https://www.ynab.com/features/goal-tracking) | objetivos con ritmo y posibilidad de pausar | Añadir ritmo opcional y pausa sin recordatorios coercitivos. |
| [Monarch](https://www.monarch.com/features/planning) | meta, contribución mensual y progreso | Añadir prioridad y periodicidad, sin acoplar saldos de cuentas. |
| [Actual Budget](https://actualbudget.org/) | informes y transferencias coherentes | Mantener el ledger y excluir transferencias de ingresos/gastos. |

## 13. Diagramas

- [Flujo de aplicación](../architecture/application-flow.md)
- [Modelo de datos](../architecture/database-diagram.md)

## 14. Cambios implementados

- Informes: controles de periodo, límites de calendario y ranking raíz/subcategoría.
- Objetivos: prioridad, frecuencia, edición, pausa/reanudación e indicador neutral de aportaciones.
- Rendimiento: lazy loading y chunks manuales.
- Tres migraciones SQL nuevas aplicadas en el proyecto remoto; reconciliación del historial pendiente.

## 15. Pendientes y acciones del usuario

Se mantienen centralizados en `PENDIENTES_PROYECTO.md` y `USER_ACTIONS.md`: aplicar migraciones, validar con datos ficticios y completar endurecimiento de producción.

## 16. Ideas adicionales de alto valor

1. Entitlements centralizados cuando exista una decisión de monetización.
2. Exposición gradual de módulos ocultos tras sus recorridos guiados.
3. Pruebas E2E con dos usuarios efímeros en un proyecto Supabase de staging.

## 17. Checklist final

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Localhost visual | PASS parcial | acceso desktop, Informes y Objetivos autenticados; sin escritura |
| Lint, tipos, tests y build | PASS | 20 web, 31 API, Ruff, Vite |
| Informes por periodo | PASS local y UI autenticada | cuatro pruebas de periodo y controles visibles |
| Objetivos completo | PASS local / PASS esquema remoto | cliente y migración aplicada; mutaciones guiadas pendientes |
| RLS y dos usuarios | BLOCKED | necesita Supabase y usuarios de prueba |
| Diagramas portables | PASS | Mermaid en arquitectura |
| Producción/Auth/GraphQL | BLOCKED | acciones externas registradas |
