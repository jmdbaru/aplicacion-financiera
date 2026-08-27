# Arquitectura general

## Estado

Propuesta inicial de la Fase 0. Se concretará durante las fases técnicas sin anticipar funcionalidades.

## Principios

- Monorepositorio con aplicaciones desplegables separadas y contratos explícitos.
- Backend como frontera de negocio; Supabase Auth identifica y PostgreSQL/RLS aplica el aislamiento final.
- Ledger de doble entrada como fuente de verdad; saldos y agregados se derivan.
- Organización por dominios, con seguridad, accesibilidad, observabilidad y pruebas desde las fundaciones.

## Contenedores

1. **Web**: React, TypeScript, Vite, Tailwind CSS, Motion, Lucide, TanStack Query, formularios tipados y Recharts.
2. **API**: FastAPI, Pydantic y Uvicorn; valida JWT y expone `/api/v1`.
3. **Datos e identidad**: Supabase Auth y PostgreSQL con RLS y migraciones versionadas.
4. **CI**: formato, lint, tipos, pruebas, build y migraciones, sin despliegues destructivos.

## Dominios previstos

Identidad y preferencias; cuentas y ledger; categorías y presupuestos; recurrencias y calendario; objetivos; patrimonio; informes; importaciones y reglas; inversiones; notificaciones y exportación.

## Estructura objetivo

```text
apps/
  web/
  api/
packages/
  contracts/        # solo si existe reutilización real
supabase/
  migrations/
  seed.sql
tests/
  e2e/
docs/
```

La Fase 1 decidirá el gestor del workspace y creará la estructura ejecutable. No se crean carpetas vacías.

## Flujo financiero

Cliente -> API autentica y valida -> caso de uso aplica reglas -> transacción/RPC persiste cabecera y entradas atómicamente -> RLS limita al usuario -> contrato tipado -> invalidación selectiva de caché.

## Convenciones

- Código, tablas y endpoints en inglés; interfaz y documentación operativa en español.
- UUID para identificadores públicos; `timestamptz` UTC para instantes.
- API versionada y errores con código estable, mensaje seguro e identificador de correlación.
- Componentes sin lógica financiera; rutas sin SQL directo.
- Dependencias fijadas y lockfiles obligatorios desde Fase 1.

## Objetivos no funcionales iniciales

- WCAG 2.2 AA en flujos principales.
- API p95 inferior a 500 ms en operaciones ordinarias, excluyendo terceros.
- Carga inicial web objetivo inferior a 250 KiB gzip, revisable con medición.
- Aislamiento total entre usuarios incluso ante llamadas directas.

