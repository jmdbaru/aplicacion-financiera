"""Rutas HTTP de la API v1."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status

from financiera_api.auth import require_bearer_token
from financiera_api.config import Settings, get_settings
from financiera_api.schemas import HealthResponse, ProfileResponse

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


@router.get("/profile", response_model=ProfileResponse, summary="Perfil del usuario autenticado")
async def profile(token: str = Depends(require_bearer_token)) -> ProfileResponse:
    """Obtiene el perfil a través de RLS, usando el JWT del usuario solicitante."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="auth_not_configured",
        )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.supabase_url.rstrip('/')}/rest/v1/profiles",
                params={
                    "select": "display_name,currency_code,locale,time_zone",
                    "limit": "1",
                },
                headers={
                    "apikey": settings.supabase_publishable_key,
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="profile_service_unavailable",
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="profile_service_error",
        )

    profiles = response.json()
    if not profiles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="profile_not_found",
        )

    return ProfileResponse.model_validate(profiles[0])
