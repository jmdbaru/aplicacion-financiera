"""Contratos de patrimonio."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

WealthItemType = Literal["asset", "liability"]
WealthCategory = Literal[
    "property",
    "vehicle",
    "investment",
    "cash_equivalent",
    "loan",
    "mortgage",
    "credit",
    "other",
]


class WealthItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    item_type: WealthItemType
    category: WealthCategory
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    notes: str | None = Field(default=None, max_length=240)
    initial_value: Decimal = Field(ge=0, max_digits=20, decimal_places=4)
    valuation_date: date | None = None


class WealthItemUpdate(BaseModel):
    is_active: bool


class WealthValuationCreate(BaseModel):
    amount: Decimal = Field(ge=0, max_digits=20, decimal_places=4)
    valuation_date: date | None = None
    source: str = Field(default="manual", min_length=1, max_length=80)
    note: str | None = Field(default=None, max_length=240)


class WealthItemResponse(BaseModel):
    id: str
    name: str
    item_type: WealthItemType
    category: WealthCategory
    currency_code: str
    notes: str | None = None
    is_active: bool
    created_at: datetime | None = None


class WealthValuationResponse(BaseModel):
    id: str
    item_id: str
    amount: Decimal
    valuation_date: date
    source: str
    note: str | None = None
