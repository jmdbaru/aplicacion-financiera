# Financiera API

API FastAPI versionada. En esta Fase 1 solo contiene configuración segura, contratos de error, logging con correlación y health check.

## Ejecución futura

Cuando esté disponible un entorno Python con dependencias instalables:

```powershell
python -m pip install -e ".[dev]"
uvicorn financiera_api.main:app --app-dir src --reload
pytest
ruff check .
```

No configurar secretos en este archivo. Copiar `.env.example` a `.env` únicamente en el entorno local.

