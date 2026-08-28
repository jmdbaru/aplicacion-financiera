"""Rutas de reglas recurrentes; la generación se delega a una RPC idempotente."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.budget_api import _request
from financiera_api.finance_api import _connection, _ensure
from financiera_api.recurring_schemas import (
    RecurringGeneration,
    RecurringRuleCreate,
    RecurringRuleResponse,
)

router = APIRouter(tags=["recurring"])
CurrentUser = Annotated[AuthenticatedUser, Depends(require_bearer_token)]


@router.get("/recurring-rules", response_model=list[RecurringRuleResponse])
async def list_rules(user: CurrentUser) -> list[RecurringRuleResponse]:
    base, headers = _connection(user)
    response = await _request(
        "GET", f"{base}/rest/v1/recurring_rules", headers=headers,
        params={"select": "*", "order": "next_run_on.asc"},
    )
    rows = _ensure(response, (200,))
    if not isinstance(rows, list):
        raise HTTPException(status_code=502, detail="invalid_recurring_response")
    return [RecurringRuleResponse.model_validate(row) for row in rows]


@router.post("/recurring-rules", response_model=RecurringRuleResponse, status_code=201)
async def create_rule(rule: RecurringRuleCreate, user: CurrentUser) -> RecurringRuleResponse:
    base, headers = _connection(user)
    payload = {
        **rule.model_dump(mode="json"), "name": rule.name.strip(), "user_id": user.user_id,
    }
    response = await _request(
        "POST", f"{base}/rest/v1/recurring_rules",
        headers={**headers, "Prefer": "return=representation"}, json=payload,
    )
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_recurring_response")
    return RecurringRuleResponse.model_validate(rows[0])


@router.post("/recurring-rules/generate", response_model=RecurringGeneration)
async def generate_rules(user: CurrentUser, until: date) -> RecurringGeneration:
    base, headers = _connection(user)
    response = await _request(
        "POST", f"{base}/rest/v1/rpc/generate_recurring_transactions",
        headers=headers, json={"p_until": until.isoformat()},
    )
    payload = _ensure(response, (200,))
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="invalid_recurring_response")
    return RecurringGeneration.model_validate(payload)
