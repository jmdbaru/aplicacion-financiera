# Fase 0 — Auditoría, definición y base de trabajo

- Fecha: 2026-08-27
- Estado final: en revisión

## Objetivo y alcance

Auditar el repositorio, crear documentación viva y definir arquitectura, modelo lógico, seguridad RLS, convenciones y plan continuable. No incluye fundaciones ejecutables ni módulos financieros.

## Estado inicial

- Único archivo: `PROMPT_MAESTRO_CODEX_APP_FINANCIERA.md`.
- La carpeta no era reconocida inicialmente como repositorio Git; durante la validación apareció un directorio `.git` consultable pero con configuración protegida contra escritura.
- Sin código, dependencias, migraciones, tests ni documentación operativa.
- Python 3.12.10 y Git 2.53.0 disponibles.
- Node y npm no disponibles en `PATH`.
- Sin remoto, historial ni código reutilizable.

## Trabajo realizado

Se creó la documentación obligatoria, se definieron contenedores, dominios, estructura, convenciones, modelo relacional, invariantes, índices y estrategia RLS. Se registraron ADR y reglas mínimas de higiene.

## Archivos afectados

`docs/`, `PROJECT_STATUS.md`, `USER_ACTIONS.md`, `CHANGELOG.md`, `.gitignore` y `.editorconfig`. No hay migraciones ni componentes.

## Decisiones

- Monorepositorio para coordinar contratos y migraciones con despliegues separados.
- Ledger de doble entrada para consistencia, neutralidad de transferencias y auditoría.
- RLS como última barrera de aislamiento.
- Sin scaffolding aún: corresponde a Fase 1 y Node no está disponible.

## Base de datos y rollback

No se modificó ninguna base. El modelo es documental. Rollback: revertir estos archivos mediante Git; no existe estado externo.

## Endpoints y reglas

No se añadieron endpoints. Regla central propuesta: cada transacción contabilizada agrupa entradas balanceadas a cero por moneda; transferencias no son ingresos ni gastos.

## Seguridad y RLS

Se diseñó la matriz por operación y la prueba con dos usuarios. Se implementará y ejecutará en Fase 2.

## Pruebas y resultados

- Inventario de archivos y herramientas.
- Comprobación de Git, remotos y entorno.
- Validación de estructura documental y enlaces.
- Búsqueda de secretos evidentes y artefactos.
- Revisión final de estado Git.

No aplican lint, tipos, build, tests o migraciones porque no hay código ejecutable.

## Incidencias

Node/npm ausentes: acción previa de Fase 1. El repositorio se conectó posteriormente a GitHub en la rama `main`; el remoto `origin` ya está disponible. Los archivos de esta fase siguen sin añadir al control de versiones.

## Deuda técnica real

- Versiones y herramientas exactas: Fase 1.
- SQL, políticas y pruebas RLS: Fase 2.
- Solución de formularios frontend: decisión documentada en Fase 1.

## Validación manual

Revisar `PROJECT_STATUS.md`, arquitectura, ADR e informe y confirmar que reflejan el producto.

## Criterios de aceptación

- [x] Estado real auditado.
- [x] Documentación viva creada.
- [x] Arquitectura, dominios y estructura definidos.
- [x] Modelo, invariantes e índices documentados.
- [x] Estrategia RLS y pruebas multiusuario propuestas.
- [x] Pruebas, entornos, despliegue y mantenimiento documentados.
- [x] Sin avance a Fase 1, secretos ni artefactos conocidos.
- [x] Limitación de permisos Git registrada sin alterar metadatos protegidos.
- [ ] Aprobación expresa del usuario.
