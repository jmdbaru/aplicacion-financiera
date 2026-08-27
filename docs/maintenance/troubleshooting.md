# Resolución de problemas

## Node o npm no se reconocen

Detectado en Fase 0. En Fase 1 se fijará una versión LTS compatible, se instalará por un canal oficial y se verificarán ambos comandos.

## La carpeta no es un repositorio Git

Inicializar localmente y configurar remoto solo con la URL real. No inventar ni publicar un repositorio.

Si `.git/config` devuelve `Permission denied`, comprobar primero propietario y permisos del directorio `.git`; no eliminarlo ni recrearlo sin confirmar que no contiene historial recuperable. Este problema quedó resuelto tras conectar el repositorio actual a GitHub.

## Variables de entorno

Confirmar `.env.example`, `.env` ignorado y ausencia de secretos en historial. No imprimir tokens.

## Fallos RLS futuros

Reproducir con dos usuarios, inspeccionar políticas/claims y probar la base directamente. Nunca resolver desactivando RLS.
