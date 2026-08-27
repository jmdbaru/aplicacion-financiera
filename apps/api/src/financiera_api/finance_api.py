"""Rutas del núcleo financiero respaldadas por PostgREST y RLS."""

from datetime import date
from decimal import Decimal
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.config import get_settings
from financiera_api.finance_schemas import (
    FinancialAccountCreate,
    FinancialAccountResponse,
    FinancialAccountUpdate,
    LedgerTransactionCreate,
    LedgerTransactionResponse,
    ReverseTransactionRequest,
)

router = APIRouter(tags=["finance"])
CurrentUser = Annotated[AuthenticatedUser, Depends(require_bearer_token)]


def _connection(user: AuthenticatedUser) -> tuple[str, dict[str, str]]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(status_code=503, detail="auth_not_configured")
    return settings.supabase_url.rstrip("/"), {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {user.access_token}",
    }


def _ensure(response: httpx.Response, expected: tuple[int, ...]) -> object:
    if response.status_code not in expected:
        raise HTTPException(status_code=502, detail="finance_service_error")
    try:
        return response.json()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="invalid_finance_response") from error


@router.get("/accounts", response_model=list[FinancialAccountResponse])
async def list_accounts(
    user: CurrentUser,
    include_archived: bool = False,
) -> list[FinancialAccountResponse]:
    base, headers = _connection(user)
    params = {
        "select": "id,name,account_type,currency_code,is_active",
        "user_id": f"eq.{user.user_id}",
        "order": "created_at.desc",
    }
    if not include_archived:
        params["is_active"] = "eq.true"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            accounts_response = await client.get(
                f"{base}/rest/v1/financial_accounts", params=params, headers=headers
            )
            entries_response = await client.get(
                f"{base}/rest/v1/ledger_entries",
                params={
                    "select": "account_id,amount",
                    "user_id": f"eq.{user.user_id}",
                    "entry_kind": "eq.account",
                },
                headers=headers,
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="finance_service_unavailable") from error
    accounts = _ensure(accounts_response, (200,))
    entries = _ensure(entries_response, (200,))
    balances: dict[str, Decimal] = {}
    for entry in entries if isinstance(entries, list) else []:
        account_id = str(entry["account_id"])
        balances[account_id] = balances.get(account_id, Decimal()) + Decimal(str(entry["amount"]))
    return [
        FinancialAccountResponse.model_validate(
            {**account, "balance": balances.get(str(account["id"]), Decimal())}
        )
        for account in accounts if isinstance(accounts, list)
    ]


@router.post("/accounts", response_model=FinancialAccountResponse, status_code=201)
async def create_account(
    account: FinancialAccountCreate,
    user: CurrentUser,
) -> FinancialAccountResponse:
    base, headers = _connection(user)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{base}/rest/v1/financial_accounts",
                headers={**headers, "Prefer": "return=representation"},
                json={
                    **account.model_dump(),
                    "name": account.name.strip(),
                    "user_id": user.user_id,
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="finance_service_unavailable") from error
    rows = _ensure(response, (200, 201))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="invalid_finance_response")
    return FinancialAccountResponse.model_validate({**rows[0], "balance": 0})


@router.patch("/accounts/{account_id}", response_model=FinancialAccountResponse)
async def update_account(
    account_id: str,
    update: FinancialAccountUpdate,
    user: CurrentUser,
) -> FinancialAccountResponse:
    base, headers = _connection(user)
    payload = update.model_dump(exclude_unset=True)
    if "name" in payload:
        payload["name"] = str(payload["name"]).strip()
    if payload.get("is_active") is False:
        payload["archived_at"] = date.today().isoformat()
    elif payload.get("is_active") is True:
        payload["archived_at"] = None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.patch(
                f"{base}/rest/v1/financial_accounts",
                params={"id": f"eq.{account_id}", "user_id": f"eq.{user.user_id}"},
                headers={**headers, "Prefer": "return=representation"},
                json=payload,
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="finance_service_unavailable") from error
    rows = _ensure(response, (200,))
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=404, detail="account_not_found")
    return FinancialAccountResponse.model_validate({**rows[0], "balance": 0})


@router.post("/transactions", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: LedgerTransactionCreate,
    user: CurrentUser,
) -> dict[str, str]:
    base, headers = _connection(user)
    payload = transaction.model_dump(mode="json")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{base}/rest/v1/rpc/create_ledger_transaction",
                headers=headers,
                json={f"p_{key}": value for key, value in payload.items()},
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="finance_service_unavailable") from error
    transaction_id = _ensure(response, (200,))
    return {"id": str(transaction_id)}


@router.get("/transactions", response_model=list[LedgerTransactionResponse])
async def list_transactions(
    user: CurrentUser,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[LedgerTransactionResponse]:
    base, headers = _connection(user)
    params = {
        "select": (
            "id,effective_date,description,transaction_type,reversed_transaction_id,"
            "ledger_entries(account_id,entry_kind,currency_code,amount)"
        ),
        "user_id": f"eq.{user.user_id}",
        "order": "effective_date.desc,id.desc",
        "limit": str(limit),
        "offset": str(offset),
    }
    if date_from:
        params["effective_date"] = f"gte.{date_from.isoformat()}"
    if date_to:
        params["effective_date"] = f"lte.{date_to.isoformat()}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{base}/rest/v1/ledger_transactions", params=params, headers=headers
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="finance_service_unavailable") from error
    rows = _ensure(response, (200,))
    if not isinstance(rows, list):
        raise HTTPException(status_code=502, detail="invalid_finance_response")
    return [
        LedgerTransactionResponse.model_validate(
            {**row, "entries": row.pop("ledger_entries", [])}
        )
        for row in rows
    ]


@router.post("/transactions/{transaction_id}/reverse", status_code=201)
async def reverse_transaction(
    transaction_id: str,
    reversal: ReverseTransactionRequest,
    user: CurrentUser,
) -> dict[str, str]:
    base, headers = _connection(user)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{base}/rest/v1/rpc/reverse_ledger_transaction",
                headers=headers,
                json={
                    "p_transaction_id": transaction_id,
                    "p_effective_date": reversal.effective_date.isoformat(),
                    "p_description": reversal.description,
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="finance_service_unavailable") from error
    reversal_id = _ensure(response, (200,))
    return {"id": str(reversal_id)}
