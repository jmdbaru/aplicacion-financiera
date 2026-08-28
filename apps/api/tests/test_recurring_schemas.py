import pytest
from pydantic import ValidationError

from financiera_api.recurring_schemas import RecurringRuleCreate


def test_monthly_rule_requires_anchor_day() -> None:
    with pytest.raises(ValidationError, match="día ancla"):
        RecurringRuleCreate.model_validate({
            "name": "Alquiler", "transaction_type": "expense", "account_id": "a",
            "currency_code": "EUR", "amount": "700", "frequency": "monthly",
            "next_run_on": "2026-08-28",
        })


def test_transfer_requires_destination_account() -> None:
    with pytest.raises(ValidationError, match="cuenta destino"):
        RecurringRuleCreate.model_validate({
            "name": "Ahorro", "transaction_type": "transfer", "account_id": "a",
            "currency_code": "EUR", "amount": "100", "frequency": "daily",
            "next_run_on": "2026-08-28",
        })
