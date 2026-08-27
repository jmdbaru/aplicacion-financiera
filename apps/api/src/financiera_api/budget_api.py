"""Rutas de categorías y presupuestos respaldadas por PostgREST y RLS."""

from datetime import date
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.budget_schemas import (
    BudgetCreate,
    BudgetOverview,
    BudgetResponse,
    BudgetUpdate,
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)
from financiera_api.finance_api import _connection, _ensure

router = APIRouter(tags=["categories-and-budgets"])
CurrentUser = Annotated[AuthenticatedUser, Depends(require_bearer_token)]


async def _request(
    method: str,
    url: str,
    *,
    headers: dict[str, str],
    params: dict[str, str] | None = None,
    json: object | None = None,
) -> httpx.Response:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            return await client.request(
                method, url, headers=headers, params=params, json=json
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=503, detail="budget_service_unavailable"
        ) from error


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    user: CurrentUser,
    include_archived: bool = False,
) -> list[CategoryResponse]:
    base, headers = _connection(user)
    params = {
        "select": "id,name,type,icon,color,parent_id,is_default,is_active,user_id",
        "order": "is_default.desc,name.asc",
    }
    if not include_archived:
        params["is_active"] = "eq.true"
    response = await _request(
        "GET", f"{base}/rest/v1/categories", headers=headers, params=params
    )
    rows = _ensure(response, (200,))
    if not isinstance(rows, list):
        raise HTTPException(status_code=502, detail="invalid_budget_response")
    return [CategoryResponse.model_validate(row) for row in rows]


@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    category: CategoryCreate,
    user: CurrentUser,
) -> CategoryResponse:
    base, headers = _connection(user)
    response = await _request(
        "POST",
        f"{base}/rest/v1/categories",
        headers={**headers, "Prefer": "return=representation"},
        json={
            **category.model_dump(),
            "name": category.name.strip(),
            "icon": category.icon.strip(),
            "user_id": user.user_id,
            "is_default": False,
        },
    )
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_budget_response")
    return CategoryResponse.model_validate(rows[0])


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    update: CategoryUpdate,
    user: CurrentUser,
) -> CategoryResponse:
    base, headers = _connection(user)
    payload = update.model_dump(exclude_unset=True)
    active = payload.pop("is_active", None)
    if active is not None:
        status_response = await _request(
            "POST",
            f"{base}/rest/v1/rpc/set_category_active",
            headers=headers,
            json={"p_category_id": category_id, "p_is_active": active},
        )
        _ensure(status_response, (200, 204))
    if "name" in payload:
        payload["name"] = str(payload["name"]).strip()
    if "icon" in payload:
        payload["icon"] = str(payload["icon"]).strip()
    if payload:
        response = await _request(
            "PATCH",
            f"{base}/rest/v1/categories",
            headers={**headers, "Prefer": "return=representation"},
            params={"id": f"eq.{category_id}", "user_id": f"eq.{user.user_id}"},
            json=payload,
        )
        rows = _ensure(response, (200,))
    else:
        response = await _request(
            "GET",
            f"{base}/rest/v1/categories",
            headers=headers,
            params={
                "select": "id,name,type,icon,color,parent_id,is_default,is_active,user_id",
                "id": f"eq.{category_id}",
                "user_id": f"eq.{user.user_id}",
            },
        )
        rows = _ensure(response, (200,))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=404, detail="category_not_found")
    return CategoryResponse.model_validate(rows[0])


@router.get("/budgets/overview", response_model=BudgetOverview)
async def budget_overview(
    user: CurrentUser,
    period_start: date,
    currency_code: str = Query(pattern=r"^[A-Z]{3}$"),
) -> BudgetOverview:
    if period_start.day != 1:
        raise HTTPException(status_code=422, detail="invalid_budget_period")
    base, headers = _connection(user)
    response = await _request(
        "POST",
        f"{base}/rest/v1/rpc/get_budget_overview",
        headers=headers,
        json={
            "p_period_start": period_start.isoformat(),
            "p_currency_code": currency_code,
        },
    )
    payload = _ensure(response, (200,))
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="invalid_budget_response")
    return BudgetOverview.model_validate(payload)


@router.post("/budgets", response_model=BudgetResponse, status_code=201)
async def create_budget(budget: BudgetCreate, user: CurrentUser) -> BudgetResponse:
    base, headers = _connection(user)
    response = await _request(
        "POST",
        f"{base}/rest/v1/budgets",
        headers={**headers, "Prefer": "return=representation"},
        json={**budget.model_dump(mode="json"), "user_id": user.user_id},
    )
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_budget_response")
    return BudgetResponse.model_validate(rows[0])


@router.patch("/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    update: BudgetUpdate,
    user: CurrentUser,
) -> BudgetResponse:
    base, headers = _connection(user)
    response = await _request(
        "PATCH",
        f"{base}/rest/v1/budgets",
        headers={**headers, "Prefer": "return=representation"},
        params={"id": f"eq.{budget_id}", "user_id": f"eq.{user.user_id}"},
        json=update.model_dump(mode="json", exclude_unset=True),
    )
    rows = _ensure(response, (200,))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=404, detail="budget_not_found")
    return BudgetResponse.model_validate(rows[0])


@router.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(budget_id: str, user: CurrentUser) -> Response:
    base, headers = _connection(user)
    response = await _request(
        "DELETE",
        f"{base}/rest/v1/budgets",
        headers=headers,
        params={"id": f"eq.{budget_id}", "user_id": f"eq.{user.user_id}"},
    )
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=502, detail="budget_service_error")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
