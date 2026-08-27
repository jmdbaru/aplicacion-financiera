from decimal import Decimal

import pytest
from pydantic import ValidationError

from financiera_api.budget_schemas import BudgetCreate, BudgetOverview, CategoryCreate
from financiera_api.main import create_app


def test_budget_requires_first_day_of_month() -> None:
    with pytest.raises(ValidationError, match="primer día"):
        BudgetCreate.model_validate(
            {
                "category_id": "category-1",
                "period_start": "2026-08-27",
                "currency_code": "EUR",
                "amount": "100",
            }
        )


def test_category_rejects_invalid_color() -> None:
    with pytest.raises(ValidationError):
        CategoryCreate.model_validate(
            {"name": "Hogar", "type": "expense", "color": "green"}
        )


def test_budget_overview_preserves_decimal_values() -> None:
    overview = BudgetOverview.model_validate(
        {
            "period_start": "2026-08-01",
            "currency_code": "EUR",
            "total_budget": "500.00",
            "budgeted_spent": "125.50",
            "outside_budget_spent": "20",
            "items": [
                {
                    "id": "budget-1",
                    "category_id": "category-1",
                    "category_name": "Hogar",
                    "icon": "home",
                    "color": "#10B981",
                    "amount": "500",
                    "alert_threshold_pct": 80,
                    "spent": "125.50",
                    "remaining": "374.50",
                    "usage_pct": "25.10",
                    "status": "ok",
                }
            ],
        }
    )

    assert overview.budgeted_spent == Decimal("125.50")


def test_category_and_budget_routes_are_exposed() -> None:
    paths = create_app().openapi()["paths"]

    assert "/api/v1/categories" in paths
    assert "/api/v1/budgets/overview" in paths
    assert "/api/v1/budgets/{budget_id}" in paths
