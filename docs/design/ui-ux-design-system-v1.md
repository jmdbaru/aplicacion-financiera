# Sistema visual y UX v1

Fecha: 2026-08-31

## Decisión aplicada

La aplicación mantiene el verde principal como color de identidad y añade un secundario azul cian suave para jerarquía, contexto y pequeños acentos. La navegación principal pasa al sidebar para evitar que el crecimiento funcional convierta la barra superior en una fila interminable de pestañas.

## Navegación

La navegación queda agrupada por intención de usuario:

- Principal: Inicio.
- Dinero: Movimientos, Cuentas e Importar.
- Planificación: Presupuestos, Objetivos y Recurrentes.
- Análisis: Informes, Patrimonio e Inversiones.
- Sistema: Categorías.

El sidebar es colapsable y guarda la preferencia en `localStorage` con la clave `financiera.sidebar`. En móvil se comporta como panel lateral temporal.

## Topbar

La barra superior deja de ser navegación principal. Su objetivo es orientar al usuario dentro de la sección actual y mantener una acción global permanente:

- título de sección;
- grupo funcional;
- descripción corta;
- botón `Añadir movimiento`.

Se deja una previsualización deshabilitada de `Ctrl K` para señalar la futura paleta de comandos sin implementar una interacción incompleta.

## Dashboard

El resumen inicial se simplifica para responder cuatro preguntas rápidas:

- cuánto dinero hay disponible;
- cuánto entra;
- cuánto sale;
- cómo queda el ahorro neto.

## Criterios para próximas pantallas

- Evitar que las categorías crezcan como navegación.
- Priorizar lenguaje funcional sobre lenguaje técnico.
- Mantener una proporción visual aproximada de 70 % neutros, 20 % color principal y 10 % color secundario/semántico.
- Usar animaciones sutiles solo para orientación, estados activos y microinteracciones.
- Mantener siempre accesible la acción de crear movimiento, salvo cuando no existan cuentas activas.

## Modales

Los modales deben usar un marco común con:

- un único backdrop visual;
- cierre por botón explícito;
- cierre con `Escape`;
- cierre al pulsar fuera del contenido;
- `role="dialog"` y `aria-modal="true"`.

Si una acción requiere pasos complejos, debe preferirse un flujo guiado dentro de un solo modal o una pantalla dedicada antes que abrir un modal encima de otro.

## Simplificación UX prioritaria

Cuando el usuario no pueda completar una acción por falta de datos previos, la interfaz debe ofrecer el siguiente paso útil en vez de desactivar el botón sin salida. Ejemplo aplicado: si no hay cuentas activas, el botón global muestra `Crear cuenta primero`.

## Aplicación del patrón en Fase UX

Se ha extendido el marco común de modales a preferencias, cuentas/movimientos, presupuestos/categorías, objetivos, patrimonio e inversiones. Las valoraciones rápidas de patrimonio se mantienen como edición inline para evitar abrir otro modal encima de la ficha.

Se han añadido ayudas contextuales en los flujos donde faltan datos previos:

- Movimientos guía a crear la primera cuenta.
- Recurrentes explica que necesita una cuenta activa.
- Importaciones bloquea la subida si no hay cuenta destino y explica que las reglas requieren categorías.
- Inversiones guía el orden cartera → instrumento → operación.
- Presupuestos explica que necesita categorías disponibles cuando no se puede crear un límite nuevo.

Las confirmaciones destructivas deben usar el mismo marco visual; la eliminación de presupuestos ya no usa `window.confirm`.
