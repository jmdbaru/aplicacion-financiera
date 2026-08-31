"""Endpoint de informes, respaldado por agregaciones en Supabase."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.budget_api import _request
from financiera_api.finance_api import _connection, _ensure
from financiera_api.reports_schemas import ReportsOverview

router = APIRouter(tags=["reports"])
CurrentUser = Annotated[AuthenticatedUser, Depends(require_bearer_token)]


@router.get("/reports/overview", response_model=ReportsOverview)
async def reports_overview(
    user: CurrentUser,
    date_from: date,
    date_to: date,
    currency_code: str = Query(pattern=r"^[A-Z]{3}$"),
) -> ReportsOverview:
    if date_to < date_from:
        raise HTTPException(status_code=422, detail="invalid_reports_period")
    base, headers = _connection(user)
    response = await _request(
        "POST",
        f"{base}/rest/v1/rpc/get_reports_overview",
        headers=headers,
        json={
            "p_date_from": date_from.isoformat(),
            "p_date_to": date_to.isoformat(),
            "p_currency_code": currency_code,
        },
    )
    payload = _ensure(response, (200,))
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="invalid_reports_response")
    return ReportsOverview.model_validate(payload)
