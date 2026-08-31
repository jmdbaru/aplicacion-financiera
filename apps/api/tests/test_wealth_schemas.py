import pytest
from pydantic import ValidationError

from financiera_api.wealth_schemas import WealthItemCreate, WealthValuationCreate


def test_wealth_item_initial_value_cannot_be_negative():
    with pytest.raises(ValidationError):
        WealthItemCreate.model_validate(
            {
                "name": "Vivienda",
                "item_type": "asset",
                "category": "property",
                "currency_code": "EUR",
                "initial_value": -1,
            }
        )


def test_wealth_currency_must_be_iso_code():
    with pytest.raises(ValidationError):
        WealthItemCreate.model_validate(
            {
                "name": "Hipoteca",
                "item_type": "liability",
                "category": "mortgage",
                "currency_code": "EURO",
                "initial_value": 100000,
            }
        )


def test_wealth_valuation_note_is_limited():
    with pytest.raises(ValidationError):
        WealthValuationCreate.model_validate({"amount": 10, "note": "x" * 241})
