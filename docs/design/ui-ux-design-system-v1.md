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
