import pytest
from pydantic import ValidationError

from financiera_api.goals_schemas import ContributionCreate, GoalCreate


def test_goal_amount_must_be_positive():
    with pytest.raises(ValidationError):
        GoalCreate.model_validate({"name": "Viaje", "target_amount": 0, "currency_code": "EUR"})


def test_contribution_note_is_limited():
    with pytest.raises(ValidationError):
        ContributionCreate.model_validate({"amount": 10, "note": "x" * 241})
