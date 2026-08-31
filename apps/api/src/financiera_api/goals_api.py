"""Rutas de objetivos de ahorro usando PostgREST y RLS."""

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.finance_api import _connection, _ensure
from financiera_api.goals_schemas import (
    ContributionCreate,
    ContributionResponse,
    GoalCreate,
    GoalResponse,
    GoalStatusUpdate,
)

router = APIRouter(tags=["savings-goals"])
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
        async with httpx.AsyncClient(timeout=5) as client:
            return await client.request(
                method, url, headers=headers, params=params, json=json
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="goals_service_unavailable") from error


@router.post("/goals", response_model=GoalResponse, status_code=201)
async def create_goal(goal: GoalCreate, user: CurrentUser) -> GoalResponse:
    base, headers = _connection(user)
    response = await _request(
        "POST",
        f"{base}/rest/v1/savings_goals",
        headers={**headers, "Prefer": "return=representation"},
        json={**goal.model_dump(mode="json"), "user_id": user.user_id},
    )
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_goals_response")
    return GoalResponse.model_validate(rows[0])


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str, update: GoalStatusUpdate, user: CurrentUser
) -> GoalResponse:
    base, headers = _connection(user)
    response = await _request(
        "PATCH",
        f"{base}/rest/v1/savings_goals",
        headers={**headers, "Prefer": "return=representation"},
        params={"id": f"eq.{goal_id}", "user_id": f"eq.{user.user_id}"},
        json=update.model_dump(),
    )
    rows = _ensure(response, (200,))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=404, detail="goal_not_found")
    return GoalResponse.model_validate(rows[0])


@router.post(
    "/goals/{goal_id}/contributions",
    response_model=ContributionResponse,
    status_code=201,
)
async def add_contribution(
    goal_id: str, contribution: ContributionCreate, user: CurrentUser
) -> ContributionResponse:
    base, headers = _connection(user)
    payload = {
        **contribution.model_dump(mode="json"),
        "goal_id": goal_id,
        "user_id": user.user_id,
    }
    response = await _request(
        "POST",
        f"{base}/rest/v1/goal_contributions",
        headers={**headers, "Prefer": "return=representation"},
        json=payload,
    )
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_goals_response")
    return ContributionResponse.model_validate(rows[0])
