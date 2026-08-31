import pytest
from pydantic import ValidationError

from financiera_api.investments_schemas import (
    InvestmentInstrumentCreate,
    InvestmentOperationCreate,
)


def test_instrument_symbol_is_limited():
    with pytest.raises(ValidationError):
        InvestmentInstrumentCreate.model_validate(
            {
                "symbol": "X" * 25,
                "name": "Instrumento",
                "instrument_type": "etf",
                "currency_code": "EUR",
            }
        )


def test_investment_operation_rejects_negative_quantity():
    with pytest.raises(ValidationError):
        InvestmentOperationCreate.model_validate(
            {
                "portfolio_id": "portfolio",
                "instrument_id": "instrument",
                "operation_date": "2026-08-31",
                "operation_type": "buy",
                "quantity": -1,
                "price": 10,
            }
        )
