# Fase 4 — Categorías y presupuestos

- Fecha de inicio: 2026-08-27
- Fecha de finalización técnica: 2026-08-28
- Estado final: en revisión, pendiente de validación funcional del usuario y aprobación expresa

## Objetivo y alcance

Incorporar categorías y subcategorías configurables a los movimientos, junto con presupuestos mensuales por categoría y moneda. La fase calcula gastado y restante, muestra alertas y comparación mensual, y define el tratamiento de movimientos sin categoría, transferencias, ajustes y reversos.

## Estado inicial encontrado

La Fase 3 estaba aprobada. Supabase contenía 14 categorías globales de catálogo, sin propietario, y políticas antiguas dirigidas al rol `public`. No existían presupuestos ni relación entre categorías y movimientos.

## Trabajo realizado

- Se conservaron las 14 categorías globales y se sustituyeron sus políticas antiguas por RLS explícita para `authenticated`.
- Se añadieron categorías personales, subcategorías de un nivel, colores, iconos, estado activo y archivo reversible.
- Se creó `budgets`, con presupuesto mensual positivo y único por usuario, categoría raíz, moneda y periodo.
- Se añadió `category_id` opcional a los movimientos y validación dentro de las RPC atómicas existentes.
- Se implementó la agregación `get_budget_overview`, que agrupa gastos de subcategorías en su categoría raíz y descuenta los reversos en el mes donde se contabilizan.
- Se añadieron API, contratos tipados, pruebas y la interfaz de categorías, presupuestos, alertas, comparación mensual y categoría opcional al registrar ingresos o gastos.

## Archivos, migraciones y componentes principales

- `supabase/migrations/202608270007_categories_and_budgets.sql`
- `supabase/migrations/202608270008_category_lifecycle.sql`
- `supabase/migrations/202608280009_category_budget_fk_indexes.sql`
- `apps/api/src/financiera_api/budget_schemas.py`
- `apps/api/src/financiera_api/budget_api.py`
- `apps/web/src/budgets.ts`
- `apps/web/src/BudgetWorkspace.tsx`
- `apps/web/src/budgets.css`
- `apps/web/src/FinanceWorkspace.tsx`

## Decisiones técnicas y motivo

- Las categorías globales permanecen como catálogo visible e inmutable. Las categorías personales llevan `user_id` y solo su propietario puede modificarlas.
- Las subcategorías solo pueden depender de una categoría raíz visible, activa y compatible en tipo. Se limita la jerarquía a un nivel para evitar ciclos y una interfaz confusa.
- Los presupuestos se asignan a categorías raíz de gasto. Un gasto en una subcategoría consume el presupuesto de su raíz, evitando que el total mensual se duplique entre padre e hijo.
- Las transferencias y ajustes no admiten categoría. Ingresos y gastos pueden quedar sin categoría; se muestran como gasto fuera de presupuesto y no se asignan artificialmente a ningún límite.
- El reverso conserva la categoría original. La agregación usa los asientos de cuenta de gastos y reversos, de modo que un reverso compensa el gasto en la fecha contable de ese reverso.
- El archivo de una categoría raíz se realiza mediante RPC: archiva primero sus hijas y después la raíz. Al restaurar, solo se restaura la raíz, preservando una hija que se hubiera archivado de forma independiente.

## Cambios en base de datos y rollback

Las tres migraciones están aplicadas en Supabase. Se añadieron las tablas, columnas, restricciones, triggers, funciones, RLS, permisos mínimos e índices necesarios.

No se debe borrar el catálogo ni los movimientos para revertir. Si aún no existen datos reales, un rollback destructivo eliminaría primero `budgets`, las funciones y triggers de Fase 4, `category_id` de `ledger_transactions` y finalmente las columnas nuevas de `categories`. Con datos, el procedimiento seguro es una migración correctiva compatible que mantenga categorías, presupuestos y referencias históricas.

## Endpoints, contratos y reglas de negocio

- Categorías: listar visibles, crear, editar categorías personales y archivar/restaurar de forma segura.
- Presupuestos: crear, editar, eliminar y consultar el resumen mensual agregado.
- Movimientos: ingresos y gastos aceptan categoría opcional; transferencias y ajustes se rechazan si llevan una.
- Un presupuesto requiere primer día de mes, importe positivo, moneda ISO y una categoría raíz activa de gasto visible para el usuario.
- Una categoría privada ajena no puede usarse en un movimiento ni en un presupuesto.

## Seguridad y RLS revisadas

- `categories` y `budgets` tienen RLS activada y forzada. No existe acceso de `anon`.
- La lectura permite catálogo global y filas propias; inserción, actualización y eliminación de presupuestos se restringen al propietario.
- Las categorías globales no pueden editarse desde el cliente. Las privadas no pueden cambiar de propietario por la combinación de `USING` y `WITH CHECK`.
- Las funciones `SECURITY DEFINER` verifican `auth.uid()`, fijan `search_path`, limitan ejecución a `authenticated` y no permiten categorías ajenas.
- Se comprobó dentro de una transacción revertida: aislamiento de categorías y presupuestos entre dos usuarios, rechazo de categoría ajena, rechazo de transferencia categorizada, presupuesto de 100 EUR que registra 50 EUR de gasto y queda en 0 tras el reverso.
- Se verificó el ciclo de archivo: archivar una categoría raíz archiva las hijas activas; restaurar la raíz no restaura sus hijas automáticamente.

## Pruebas ejecutadas y resultados

- `python -m ruff check apps\\api`: correcto.
- `python -m pytest apps\\api\\tests -q -p no:cacheprovider`: 17 pruebas correctas.
- ESLint: correcto.
- TypeScript (`tsc -b`): correcto.
- Vitest: 6 pruebas web correctas, incluyendo jerarquía y cambio de año del periodo mensual.
- Vite build: correcto; 1.767 módulos transformados, JavaScript principal de aproximadamente 223 kB (70 kB gzip).
- Pruebas SQL remotas, migraciones y lista de migraciones: correctas. Las pruebas temporales finalizaron con `ROLLBACK`.
- GitHub Actions `Quality #27` y `Deploy preview #14` para `v1.027`: correctos.

## Incidencias y resolución

- El asesor detectó las tres claves foráneas nuevas sin índice de cobertura. Se añadió `202608280009_category_budget_fk_indexes.sql` y se repitió el asesor; ya no hay avisos de claves foráneas sin índice.
- El entorno local de pruebas crea directorios de caché que pueden quedar bloqueados. Se ejecutó Pytest sin proveedor de caché para la comprobación final y se eliminaron únicamente las carpetas temporales generadas.
- Node no está instalado globalmente. Se mantuvo el runtime aislado para las comprobaciones locales y GitHub Actions ejecutó la validación oficial con el lockfile versionado.

## Deuda técnica real

- Falta la validación manual autenticada del recorrido completo, detallada en `USER_ACTIONS.md`.
- Los avisos de índices sin uso son esperados en un proyecto sin carga real. No se eliminan índices que cubren consultas y claves foráneas hasta disponer de métricas reales.
- La protección contra contraseñas filtradas de Supabase Auth sigue pendiente antes de producción; ya está registrada como acción de usuario.

## Validación manual recomendada

Iniciar sesión en la vista previa, crear una categoría personal y una subcategoría, registrar un gasto en la subcategoría, crear un presupuesto en la raíz, comprobar el progreso y el aviso, revertir el gasto y confirmar que el importe vuelve a estar disponible. Probar también un gasto sin categoría, una transferencia sin selector de categoría y el archivo/restauración de una categoría personal.

## Criterios de aceptación

- [x] Categorías globales conservadas y categorías/subcategorías personales configurables.
- [x] Archivo reversible sin destruir referencias históricas.
- [x] Presupuesto mensual único por usuario, categoría y moneda.
- [x] Gastado y restante calculados correctamente, incluidos reversos.
- [x] Tratamiento probado de movimientos sin categoría, transferencias y ajustes.
- [x] RLS y referencias cruzadas verificadas con dos usuarios.
- [x] API, frontend, lint, pruebas, build y despliegue correctos.
- [ ] Validación funcional autenticada y aprobación expresa del usuario.

La implementación técnica de la Fase 4 está completa. La fase permanece en revisión y no autoriza iniciar la Fase 5.
