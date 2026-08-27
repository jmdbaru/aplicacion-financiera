# ADR 0002: Ledger de doble entrada

- Estado: aceptada
- Fecha: 2026-08-27

## Decisión

Separar transacciones de entradas y exigir balance cero por moneda. Los saldos se derivan del ledger y las correcciones críticas usan reversos trazables.

## Consecuencias

Aumenta la exigencia del modelo y pruebas, pero evita doble contabilización, transferencias mal clasificadas y pérdida de historia.

