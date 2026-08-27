"""Rutas HTTP de la API v1."""

from fastapi import APIRouter, Depends, Request, status

from financiera_api.config import Settings, get_settings
from financiera_api.schemas import HealthResponse
from financiera_api.auth import require_bearer_token

router = APIRouter(prefix="/api/v1", tags=["system"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Comprueba disponibilidad de la API",
)
async def health(request: Request) -> HealthResponse:
    """Endpoint sin datos privados apto para health checks."""
    settings: Settings = get_settings()
    _ = request.state.request_id
    return HealthResponse(status="ok", environment=settings.app_env)


@router.get("/session", summary="Comprueba que la solicitud contiene una sesión")
async def session(token: str = Depends(require_bearer_token)) -> dict[str, bool]:
    """Contrato base para rutas protegidas; nunca devuelve el token recibido."""
    _ = token
    return {"authenticated": True}
