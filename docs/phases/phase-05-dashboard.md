# Fase 5 — Dashboard y resumen financiero

- Fecha de inicio: 2026-08-28
- Estado: finalizada técnicamente, pendiente de validación funcional y aprobación expresa

## Alcance

El dashboard presenta disponible en la moneda seleccionada, ingresos, gastos, balance del período, estado de presupuesto, evolución de seis meses y los cinco últimos movimientos. Objetivos y reglas recurrentes no se crean ni simulan: pertenecen a fases posteriores.

## Diseño y seguridad

La migración `202608280010_dashboard_overview.sql` incorpora `get_dashboard_overview`. La función es `SECURITY INVOKER`, requiere `auth.uid()`, valida período/moneda, hereda las políticas RLS y solo concede ejecución a `authenticated`. Realiza la agregación dentro de PostgreSQL, de modo que el cliente recibe un único resumen en vez del ledger completo.

## Verificación realizada

En una transacción remota revertida se creó una cuenta temporal con un ingreso de 300 EUR y un gasto de 120 EUR. El resumen devolvió correctamente disponible 180, ingreso 300, gasto 120, balance 180 y seis meses. No se conservaron datos de prueba.

## Criterios de aceptación

- [x] Consulta agregada segura para saldo, período, presupuesto, gráfica y actividad reciente.
- [x] Estados de carga, vacío y error; interfaz adaptable y accesible.
- [x] API, web, documentación y comprobaciones locales correctas.
- [ ] Despliegue y validación funcional autenticada del usuario.
