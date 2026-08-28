# Fase 6 — Recurrentes y calendario

- Fecha de inicio y cierre técnico: 2026-08-28
- Estado: finalizada técnicamente, pendiente de validación funcional y aprobación expresa.

## Objetivo y alcance

Reglas recurrentes diarias, semanales y mensuales, con fecha próxima, zona horaria declarada, límite temporal, calendario de próximas ejecuciones y generación manual de movimientos. Objetivos de ahorro no se adelantan: son Fase 7.

## Implementación y seguridad

`recurring_rules` guarda plantillas privadas y `recurring_occurrences` enlaza cada fecha programada con su operación del ledger. Ambas tienen RLS forzada. La clave única `(rule_id, scheduled_for)` y el bloqueo de la regla hacen que `generate_recurring_transactions` sea idempotente. La RPC exige sesión, limita la generación a 366 días, valida cuentas activas y usa el ledger atómico existente.

La interfaz permite crear ingresos/gastos recurrentes, ver próxima ejecución y generar lo pendiente. Los estados de carga, vacío y error están incluidos.

## Verificación

Una prueba SQL remota revertida confirmó que una regla mensual genera una sola ocurrencia y una segunda llamada no duplica datos. Los contratos API cubren ancla mensual y destino de transferencias. Se mantiene el pendiente de protección de contraseñas filtradas de Auth ya documentado.

## Criterios de aceptación

- [x] Frecuencias, próxima ejecución, estados y zona horaria declarada.
- [x] Generación idempotente y vinculada al ledger.
- [x] Calendario/resumen de reglas responsive y estados UX.
- [ ] Comprobaciones finales, despliegue y validación autenticada del usuario.
