import pytest
from pydantic import ValidationError

from financiera_api.reports_schemas import ReportsOverview


def test_reports_currency_must_be_iso_code():
    with pytest.raises(ValidationError):
        ReportsOverview.model_validate(
            {
                "date_from": "2026-08-01",
                "date_to": "2026-08-31",
                "currency_code": "EURO",
                "income": 0,
                "expenses": 0,
                "balance": 0,
                "previous_income": 0,
                "previous_expenses": 0,
                "previous_balance": 0,
            }
        )
