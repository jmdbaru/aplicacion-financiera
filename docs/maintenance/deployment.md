# Despliegue y entornos

Objetivo: web en Vercel, API en Render, datos/identidad en Supabase y código/CI en GitHub. No hay despliegues configurados en Fase 0.

Se prevén `local`, `preview/staging` y `production`, con secretos y recursos separados. Las migraciones nunca se ejecutarán desde previews contra producción.

HTTPS, CORS exacto, cabeceras, health checks, logs redactados, backups verificados y rollback serán criterios obligatorios. Fase 13 detallará el procedimiento.

