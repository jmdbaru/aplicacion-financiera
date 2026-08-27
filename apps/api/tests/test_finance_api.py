import httpx
from fastapi.testclient import TestClient

from financiera_api.auth import AuthenticatedUser, require_bearer_token
from financiera_api.config import get_settings
from financiera_api.main import create_app


async def authenticated_user() -> AuthenticatedUser:
    return AuthenticatedUser(access_token="test-token", user_id="user-1")  # noqa: S106


class AccountsClient:
    async def __aenter__(self) -> "AccountsClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def get(self, url: str, **_: object) -> httpx.Response:
        if url.endswith("financial_accounts"):
            return httpx.Response(
                200,
                json=[
                    {
                        "id": "account-1",
                        "name": "Principal",
                        "account_type": "bank",
                        "currency_code": "EUR",
                        "is_active": True,
                    }
                ],
            )
        return httpx.Response(
            200,
            json=[
                {"account_id": "account-1", "amount": "125.50"},
                {"account_id": "account-1", "amount": "-20"},
            ],
        )


def test_accounts_include_derived_balance(monkeypatch) -> None:
    monkeypatch.setattr(
        "financiera_api.finance_api.httpx.AsyncClient", lambda **_: AccountsClient()
    )
    settings = get_settings()
    original_url, original_key = settings.supabase_url, settings.supabase_publishable_key
    settings.supabase_url = "https://example.supabase.co"
    settings.supabase_publishable_key = "public-key"
    app = create_app()
    app.dependency_overrides[require_bearer_token] = authenticated_user
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/accounts")
    finally:
        settings.supabase_url, settings.supabase_publishable_key = original_url, original_key
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()[0]["balance"] == "105.50"
