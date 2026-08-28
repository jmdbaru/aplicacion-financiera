from decimal import Decimal

from financiera_api.dashboard_schemas import DashboardOverview
from financiera_api.main import create_app


def test_dashboard_overview_preserves_aggregated_values() -> None:
    overview = DashboardOverview.model_validate(
        {
            "period_start": "2026-08-01",
            "currency_code": "EUR",
            "available": "180",
            "active_accounts": 1,
            "income": "300",
            "expenses": "120",
            "balance": "180",
            "budget": {
                "period_start": "2026-08-01",
                "currency_code": "EUR",
                "total_budget": "0",
                "budgeted_spent": "0",
                "outside_budget_spent": "120",
                "items": [],
            },
            "monthly": [
                {
                    "period_start": "2026-08-01",
                    "income": "300",
                    "expenses": "120",
                    "balance": "180",
                }
            ],
            "recent_transactions": [],
        }
    )
    assert overview.balance == Decimal("180")


def test_dashboard_route_is_exposed() -> None:
    assert "/api/v1/dashboard/overview" in create_app().openapi()["paths"]
