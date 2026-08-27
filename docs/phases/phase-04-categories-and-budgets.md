# Fase 4 — Categorías y presupuestos

- Fecha de inicio: 2026-08-27
- Estado: en curso

## Objetivo y alcance

Incorporar categorías y subcategorías configurables a los movimientos, junto con presupuestos mensuales por categoría y moneda. La fase debe calcular gastado y restante, mostrar alertas y comparaciones mensuales, y definir expresamente el tratamiento de movimientos sin categoría, transferencias y reversos.

## Estado inicial encontrado

La Fase 3 está aprobada y el ledger de doble partida funciona con RLS y operaciones atómicas. Supabase contiene una tabla `categories` preexistente con 14 categorías globales, sin propietario, y políticas antiguas dirigidas al rol `public`. No existe `budgets` ni relación entre categorías y movimientos.

## Plan de implementación

1. Adaptar sin pérdida la tabla existente, añadir jerarquía y archivo reversible, y sustituir sus políticas por RLS explícita.
2. Crear presupuestos mensuales privados con unicidad por usuario, categoría, periodo y moneda.
3. Integrar la categoría opcional en movimientos y validar su visibilidad dentro de las RPC atómicas.
4. Crear una agregación mensual segura que contabilice gastos y sus reversos sin duplicidades.
5. Exponer API y una interfaz responsive para gestionar categorías, presupuestos, alertas y comparación mensual.
6. Verificar aislamiento multiusuario, fin de mes, monedas, reversos, lint, pruebas, build y asesores.

## Riesgos y decisiones iniciales

- Las 14 categorías globales se conservarán como catálogo inmutable visible para usuarios autenticados; las categorías personales pertenecerán a un solo usuario.
- Una subcategoría solo podrá depender de una categoría raíz visible y compatible, evitando ciclos y referencias privadas cruzadas.
- Los presupuestos serán mensuales, positivos y de gasto; una categoría global o propia será válida, pero nunca una categoría privada ajena.
- Los movimientos sin categoría se mostrarán como “Sin categoría” pero no consumirán un presupuesto concreto.
- Las transferencias y ajustes no llevarán categoría. Los reversos heredarán la categoría original y compensarán el gasto del periodo en que se contabilicen.

## Criterios de aceptación

- [ ] Categorías globales conservadas y categorías/subcategorías personales configurables.
- [ ] Archivo reversible sin destruir referencias históricas.
- [ ] Presupuesto mensual único por usuario, categoría y moneda.
- [ ] Gastado y restante calculados correctamente, incluidos reversos.
- [ ] Tratamiento probado de movimientos sin categoría, transferencias y ajustes.
- [ ] RLS y referencias cruzadas verificadas con dos usuarios.
- [ ] API, frontend, lint, pruebas, build y despliegue correctos.
