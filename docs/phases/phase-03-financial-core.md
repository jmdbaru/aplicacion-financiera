# Fase 3 — Núcleo financiero: cuentas y ledger

- Fecha de inicio: 2026-08-27
- Estado: en curso

## Objetivo y alcance

Crear el núcleo contable de la aplicación: cuentas financieras por usuario, transacciones y entradas de doble partida. Incluye ingresos, gastos, ajustes y transferencias atómicas, saldos derivados, consulta paginada y edición sin borrar el histórico contable.

## Estado inicial

La Fase 2 está aprobada: Auth, `profiles`, RLS y preferencias fueron validados en la vista previa. El repositorio no tiene todavía tablas de cuentas ni ledger. El modelo lógico y el ADR de doble partida definen los invariantes que se implementarán ahora.

## Plan de implementación

1. Crear las tablas y restricciones de cuentas, cabeceras de transacción, entradas y reversos con RLS por usuario.
2. Definir una operación transaccional para registrar ingresos, gastos, ajustes y transferencias sin saldos almacenados.
3. Exponer contratos y rutas API protegidas; separar validación de dominio de HTTP.
4. Implementar la interfaz de cuentas y movimiento, con estados vacíos, filtros y feedback accesible.
5. Verificar el aislamiento entre usuarios, la suma cero por moneda, transferencias y paginación.

## Riesgos y decisiones iniciales

- Los importes se guardarán como `numeric(20,4)` y los saldos se derivarán de las entradas; no habrá un campo de saldo mutable.
- La identidad será la que valide Supabase Auth; cada relación incluirá el usuario y claves foráneas compuestas para impedir mezclar objetos de distintos usuarios.
- Las correcciones de transacciones contabilizadas se harán con reversos trazables, no con borrado destructivo.
- La transferencia requerirá al menos dos entradas compensadas de la misma moneda dentro de una única operación de base de datos.

## Criterios de aceptación

- [ ] Cuentas privadas con RLS y tipos/monedas/estados validados.
- [ ] Ledger de doble partida que conserva suma cero por moneda.
- [ ] Ingresos, gastos, ajustes y transferencias atómicos.
- [ ] Saldos derivados y listado paginado con filtros y búsqueda.
- [ ] CRUD sin destrucción de historial contabilizado.
- [ ] Pruebas de dominio, RLS y API correctas.
