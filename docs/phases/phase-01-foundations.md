# Fase 1 — Fundaciones técnicas y experiencia base

- Fecha de inicio: 2026-08-27
- Estado: bloqueada

## Alcance aprobado

Configurar React/TypeScript/Vite/Tailwind, FastAPI, calidad, tipos, pruebas, contratos comunes, layout responsive, accesibilidad, errores, logging y CI sin despliegue.

## Estado inicial encontrado

La Fase 0 fue aprobada por el usuario. Git está conectado a GitHub en la rama `main`. No existe código ejecutable ni dependencias de aplicación. Python 3.12.10 está disponible; FastAPI y Uvicorn no están instalados. Node/npm no están disponibles.

## Bloqueo

El usuario confirmó que no puede descargar aplicaciones externas en este equipo y eligió mantener el stack objetivo. React/Vite/Tailwind requieren Node/npm para instalar dependencias, ejecutar pruebas y compilar. No se sustituirá el stack por HTML/JavaScript nativo sin autorización explícita.

## Trabajo realizado

Se verificaron las herramientas y se intentó iniciar la instalación oficial de Node LTS con autorización, pero Node/npm no quedaron disponibles. Se adelantó exclusivamente trabajo que no requiere Node:

- estructura inicial de monorepositorio con `apps/api`, `apps/web` reservado y CI;
- manifiesto reproducible de API con versiones compatibles y dependencias separadas de desarrollo;
- configuración Pydantic validada, sin secretos y con CORS por lista explícita;
- aplicación FastAPI con contrato de errores, OpenAPI, health check y logging con identificador de correlación;
- pruebas unitarias/integración preparadas para configuración y health check;
- workflow de GitHub Actions para calidad de la API. El trabajo web no se incluye en CI hasta que pueda existir su manifiesto y lockfile.
- frontend React/Vite/Tailwind declarativo con navegación responsive, tokens visuales, estados vacíos, accesibilidad de teclado, soporte de movimiento reducido y pruebas de componente preparadas.
- job remoto para calidad y build web, con versión de Node fijada mediante `.nvmrc`.

No se instaló ninguna dependencia externa en local. El frontend React/Vite se preparó de forma declarativa, pero no puede ejecutarse ni validarse localmente sin Node/npm. Hasta disponer de `package-lock.json`, el job web remoto usa temporalmente `npm install`; se sustituirá obligatoriamente por `npm ci` al generar y versionar el lockfile.

## Seguridad, pruebas y migraciones

No hay migraciones ni despliegues. Se ejecutó `python -m compileall -q apps\\api\\src apps\\api\\tests` correctamente; solo valida sintaxis. No fue posible ejecutar Ruff, Pytest, FastAPI, tipos o build porque las dependencias de API no están instaladas y no se autorizan descargas externas. La configuración y los tests quedan preparados para su ejecución posterior.

## Acción necesaria

El commit `v1.001` fue enviado a GitHub para ejecutar el workflow remoto `Quality`. La consulta anónima de su estado no está permitida por el repositorio privado; revisar el resultado en la pestaña Actions de GitHub. Continúa siendo necesario disponer de un entorno autorizado con Node.js LTS y npm para generar el lockfile y reproducir la validación local.

## Criterios de aceptación

- [ ] Node/npm disponibles en el entorno de desarrollo.
- [x] Base declarativa y sintácticamente válida de backend configurada.
- [x] Frontend declarativo, layout y componentes base accesibles configurados.
- [ ] Calidad, tipos, pruebas y build correctos.
- [x] CI de comprobación de API y web creado; las ejecuciones remotas están pendientes de enviar cambios a GitHub.
