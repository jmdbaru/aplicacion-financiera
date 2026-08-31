"""Rutas HTTP de la API v1."""

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.budget_api import router as budget_router
from financiera_api.config import Settings, get_settings
from financiera_api.dashboard_api import router as dashboard_router
from financiera_api.finance_api import router as finance_router
from financiera_api.goals_api import router as goals_router
from financiera_api.recurring_api import router as recurring_router
from financiera_api.schemas import HealthResponse, ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/api/v1", tags=["system"])
CurrentUser = Annotated[AuthenticatedUser, Depends(require_bearer_token)]


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
async def session(user: CurrentUser) -> dict[str, bool]:
    """Contrato base para rutas protegidas; nunca devuelve el token recibido."""
    _ = user
    return {"authenticated": True}


@router.get("/profile", response_model=ProfileResponse, summary="Perfil del usuario autenticado")
async def profile(user: CurrentUser) -> ProfileResponse:
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
                    "user_id": f"eq.{user.user_id}",
                    "limit": "1",
                },
                headers={
                    "apikey": settings.supabase_publishable_key,
                    "Authorization": f"Bearer {user.access_token}",
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


router.include_router(finance_router)
router.include_router(budget_router)
router.include_router(dashboard_router)
router.include_router(recurring_router)
router.include_router(goals_router)


@router.patch("/profile", response_model=ProfileResponse, summary="Actualiza el perfil autenticado")
async def update_profile(
    update: ProfileUpdateRequest,
    user: CurrentUser,
) -> ProfileResponse:
    """Actualiza solo el perfil propio, filtrado y autorizado por RLS."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="auth_not_configured",
        )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.patch(
                f"{settings.supabase_url.rstrip('/')}/rest/v1/profiles",
                params={
                    "user_id": f"eq.{user.user_id}",
                    "select": "display_name,currency_code,locale,time_zone",
                },
                headers={
                    "apikey": settings.supabase_publishable_key,
                    "Authorization": f"Bearer {user.access_token}",
                    "Prefer": "return=representation",
                },
                json=update.model_dump(exclude_unset=True),
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
