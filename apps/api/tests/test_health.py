from fastapi.testclient import TestClient

from financiera_api.main import create_app


def test_health_returns_safe_status() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "x-request-id" in response.headers


def test_session_requires_bearer_token() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/session")

    assert response.status_code == 401
