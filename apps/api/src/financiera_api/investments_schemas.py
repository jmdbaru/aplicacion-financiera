"""Contratos de inversiones."""

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

InstrumentType = Literal["stock", "fund", "etf", "bond", "crypto", "other"]
OperationType = Literal["buy", "sell", "dividend", "fee"]


class InvestmentPortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    cash_account_id: str | None = None


class InvestmentInstrumentCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=24)
    name: str = Field(min_length=1, max_length=160)
    instrument_type: InstrumentType
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")


class InvestmentOperationCreate(BaseModel):
    portfolio_id: str
    instrument_id: str
    operation_date: date
    operation_type: OperationType
    quantity: Decimal = Field(ge=0, max_digits=24, decimal_places=8)
    price: Decimal = Field(ge=0, max_digits=20, decimal_places=6)
    fees: Decimal = Field(default=Decimal("0"), ge=0, max_digits=20, decimal_places=4)
    notes: str | None = Field(default=None, max_length=240)


class InvestmentValuationCreate(BaseModel):
    instrument_id: str
    valuation_date: date | None = None
    price: Decimal = Field(ge=0, max_digits=20, decimal_places=6)
    source: str = Field(default="manual", min_length=1, max_length=80)
