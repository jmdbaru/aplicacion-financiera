"""Endpoint del dashboard, respaldado por la agregación y RLS de Supabase."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.budget_api import _request
from financiera_api.dashboard_schemas import DashboardOverview
from financiera_api.finance_api import _connection, _ensure

router = APIRouter(tags=["dashboard"])
CurrentUser = Annotated[AuthenticatedUser, Depends(require_bearer_token)]


@router.get("/dashboard/overview", response_model=DashboardOverview)
async def dashboard_overview(
    user: CurrentUser,
    period_start: date,
    currency_code: str = Query(pattern=r"^[A-Z]{3}$"),
) -> DashboardOverview:
    if period_start.day != 1:
        raise HTTPException(status_code=422, detail="invalid_dashboard_period")
    base, headers = _connection(user)
    response = await _request(
        "POST",
        f"{base}/rest/v1/rpc/get_dashboard_overview",
        headers=headers,
        json={
            "p_period_start": period_start.isoformat(),
            "p_currency_code": currency_code,
        },
    )
    payload = _ensure(response, (200,))
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="invalid_dashboard_response")
    return DashboardOverview.model_validate(payload)
