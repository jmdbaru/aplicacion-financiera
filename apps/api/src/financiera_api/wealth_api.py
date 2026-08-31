"""Rutas de patrimonio usando PostgREST y RLS."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.finance_api import _connection, _ensure
from financiera_api.goals_api import _request
from financiera_api.wealth_schemas import (
    WealthItemCreate,
    WealthItemResponse,
    WealthItemUpdate,
    WealthValuationCreate,
    WealthValuationResponse,
)

router = APIRouter(tags=["wealth"])
CurrentUser = Annotated[AuthenticatedUser, Depends(require_bearer_token)]


@router.post("/wealth/items", response_model=WealthItemResponse, status_code=201)
async def create_wealth_item(item: WealthItemCreate, user: CurrentUser) -> WealthItemResponse:
    base, headers = _connection(user)
    payload = item.model_dump(mode="json", exclude={"initial_value", "valuation_date"})
    response = await _request(
        "POST",
        f"{base}/rest/v1/wealth_items",
        headers={**headers, "Prefer": "return=representation"},
        json={**payload, "user_id": user.user_id},
    )
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_wealth_response")

    created = WealthItemResponse.model_validate(rows[0])
    valuation = WealthValuationCreate(amount=item.initial_value, valuation_date=item.valuation_date)
    await add_wealth_valuation(created.id, valuation, user)
    return created


@router.patch("/wealth/items/{item_id}", response_model=WealthItemResponse)
async def update_wealth_item(
    item_id: str, update: WealthItemUpdate, user: CurrentUser
) -> WealthItemResponse:
    base, headers = _connection(user)
    response = await _request(
        "PATCH",
        f"{base}/rest/v1/wealth_items",
        headers={**headers, "Prefer": "return=representation"},
        params={"id": f"eq.{item_id}", "user_id": f"eq.{user.user_id}"},
        json=update.model_dump(),
    )
    rows = _ensure(response, (200,))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=404, detail="wealth_item_not_found")
    return WealthItemResponse.model_validate(rows[0])


@router.post(
    "/wealth/items/{item_id}/valuations",
    response_model=WealthValuationResponse,
    status_code=201,
)
async def add_wealth_valuation(
    item_id: str, valuation: WealthValuationCreate, user: CurrentUser
) -> WealthValuationResponse:
    base, headers = _connection(user)
    response = await _request(
        "POST",
        f"{base}/rest/v1/wealth_valuations",
        headers={**headers, "Prefer": "resolution=merge-duplicates,return=representation"},
        json={**valuation.model_dump(mode="json"), "item_id": item_id, "user_id": user.user_id},
    )
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_wealth_response")
    return WealthValuationResponse.model_validate(rows[0])
