# Acciones del usuario

## Fase 0 — Revisar y aprobar la base

- Estado: `PENDIENTE`
- Motivo: se exige autorización expresa para avanzar.
- Pasos: revisar `PROJECT_STATUS.md`, los tres documentos de arquitectura y el informe de Fase 0.
- Dato que debes devolver: “apruebo la fase” o correcciones concretas.
- Verificación: se registrará la fase como aprobada.
- Consecuencia de posponer: no se inicia la Fase 1.

## Preparación de Fase 1 — Node.js

- Estado: `BLOQUEADA`
- Motivo: Node/npm no están disponibles y no está permitido instalar aplicaciones externas en este equipo. React/Vite/Tailwind los requieren.
- Pasos: usar, cuando sea posible, un equipo o entorno autorizado que ya disponga de Node.js LTS y npm. No es necesario instalar nada en este equipo ni enviar credenciales.
- Dato que debes devolver: confirma cuándo exista un entorno autorizado o indícame si deseas reconsiderar formalmente el stack.
- Verificación futura: `node --version` y `npm --version` deben ejecutarse correctamente.
- Consecuencia de posponer: la Fase 1 y las siguientes no pueden implementarse ni validarse con el stack aprobado.

## Generar el lockfile web sin Node local

- Estado: `COMPLETADA`
- Motivo: `apps/web/package-lock.json` está disponible y coincide con `package.json`.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: el workflow `Quality` usará `npm ci` tras el siguiente commit.
- Consecuencia de posponer: no aplica.

## Validación remota mediante GitHub Actions

- Estado: `COMPLETADA`
- Motivo: el workflow `Quality` del commit `v1.003` finalizó correctamente para API y web.
- Pasos: no requiere ninguna acción adicional. No realizar despliegues desde Vercel ni Render en esta fase.
- Dato que debes devolver: ninguno.
- Verificación: API: Ruff correcto y 3 pruebas superadas. Web: ejecución completa con tic verde.
- Consecuencia de posponer: no aplica.

No hay cuentas externas, credenciales ni pagos pendientes en esta fase.

## Estado de Git

- Estado: `COMPLETADA`
- Motivo: el repositorio local está conectado a GitHub mediante `origin` y usa la rama `main`.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: `git remote -v` muestra el remoto configurado.
- Consecuencia de posponer: no aplica.
