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

## Validación remota mediante GitHub Actions

- Estado: `PENDIENTE`
- Motivo: el workflow puede instalar y verificar las dependencias en un runner de GitHub sin Node local, pero requiere que los cambios se añadan y envíen al remoto.
- Pasos: no realizar todavía ningún despliegue. Cuando autorices registrar los cambios de esta fase en Git, se enviarán al repositorio para activar las validaciones remotas.
- Dato que debes devolver: autorización explícita para crear un commit y hacer push, cuando quieras activar la comprobación remota.
- Verificación: la pestaña Actions de GitHub debe mostrar el workflow `Quality` correcto para API y web.
- Consecuencia de posponer: el código queda preparado, pero no se podrá validar en un entorno remoto.

No hay cuentas externas, credenciales ni pagos pendientes en esta fase.

## Estado de Git

- Estado: `COMPLETADA`
- Motivo: el repositorio local está conectado a GitHub mediante `origin` y usa la rama `main`.
- Pasos: no requiere ninguna acción adicional.
- Dato que debes devolver: ninguno.
- Verificación: `git remote -v` muestra el remoto configurado.
- Consecuencia de posponer: no aplica.
