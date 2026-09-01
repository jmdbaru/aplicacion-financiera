"""Contratos del núcleo financiero."""

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

AccountType = Literal["cash", "bank", "credit_card", "loan", "investment", "other"]
AccountColor = Literal["emerald", "blue", "violet", "rose"]
TransactionType = Literal["income", "expense", "transfer", "adjustment"]


class FinancialAccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    account_type: AccountType
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    card_color: AccountColor = "emerald"


class FinancialAccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None
    card_color: AccountColor | None = None

    @model_validator(mode="after")
    def reject_empty_update(self) -> "FinancialAccountUpdate":
        if not self.model_fields_set:
            raise ValueError("Indica al menos un cambio.")
        return self


class FinancialAccountResponse(BaseModel):
    id: str
    name: str
    account_type: AccountType
    currency_code: str
    is_active: bool
    card_color: AccountColor = "emerald"
    balance: Decimal = Decimal("0")


class LedgerEntryCreate(BaseModel):
    account_id: str | None = None
    entry_kind: Literal["account", "external"]
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    amount: Decimal = Field(max_digits=20, decimal_places=4)


class LedgerTransactionCreate(BaseModel):
    effective_date: date
    description: str = Field(min_length=1, max_length=240)
    transaction_type: TransactionType
    category_id: str | None = None
    entries: list[LedgerEntryCreate] = Field(min_length=2)

    @model_validator(mode="after")
    def validate_balance(self) -> "LedgerTransactionCreate":
        if self.transaction_type in ("transfer", "adjustment") and self.category_id:
            raise ValueError("Las transferencias y ajustes no admiten categoría.")
        totals: dict[str, Decimal] = {}
        for entry in self.entries:
            if entry.amount == 0:
                raise ValueError("Las entradas no pueden valer cero.")
            if (entry.entry_kind == "account") != (entry.account_id is not None):
                raise ValueError("La cuenta no coincide con el tipo de entrada.")
            totals[entry.currency_code] = totals.get(entry.currency_code, Decimal()) + entry.amount
        if any(total != 0 for total in totals.values()):
            raise ValueError("La transacción debe cuadrar por moneda.")
        return self


class LedgerTransactionResponse(BaseModel):
    id: str
    effective_date: date
    description: str
    transaction_type: str
    category_id: str | None = None
    reversed_transaction_id: str | None = None
    entries: list[dict[str, object]] = Field(default_factory=list)


class ReverseTransactionRequest(BaseModel):
    effective_date: date
    description: str | None = Field(default=None, max_length=240)
