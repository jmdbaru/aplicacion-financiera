from decimal import Decimal

import pytest
from pydantic import ValidationError

from financiera_api.finance_schemas import LedgerTransactionCreate


def test_balanced_income_is_valid() -> None:
    transaction = LedgerTransactionCreate.model_validate(
        {
            "effective_date": "2026-08-27",
            "description": "Nómina",
            "transaction_type": "income",
            "entries": [
                {
                    "account_id": "account-id",
                    "entry_kind": "account",
                    "currency_code": "EUR",
                    "amount": "1200.50",
                },
                {
                    "account_id": None,
                    "entry_kind": "external",
                    "currency_code": "EUR",
                    "amount": "-1200.50",
                },
            ],
        }
    )

    assert transaction.entries[0].amount == Decimal("1200.50")


def test_unbalanced_transaction_is_rejected() -> None:
    with pytest.raises(ValidationError, match="cuadrar"):
        LedgerTransactionCreate.model_validate(
            {
                "effective_date": "2026-08-27",
                "description": "Incorrecto",
                "transaction_type": "expense",
                "entries": [
                    {
                        "account_id": "account-id",
                        "entry_kind": "account",
                        "currency_code": "EUR",
                        "amount": "-10",
                    },
                    {
                        "account_id": None,
                        "entry_kind": "external",
                        "currency_code": "EUR",
                        "amount": "9",
                    },
                ],
            }
        )
