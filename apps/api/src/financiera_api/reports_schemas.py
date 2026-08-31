"""Contratos de estadisticas e informes."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ReportMonth(BaseModel):
    period_start: date
    income: Decimal
    expenses: Decimal
    balance: Decimal


class ReportCategory(BaseModel):
    category_name: str
    transaction_type: str
    amount: Decimal
    operations: int = Field(ge=0)


class ReportsOverview(BaseModel):
    date_from: date
    date_to: date
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    income: Decimal
    expenses: Decimal
    balance: Decimal
    previous_income: Decimal
    previous_expenses: Decimal
    previous_balance: Decimal
    monthly: list[ReportMonth] = Field(default_factory=list)
    categories: list[ReportCategory] = Field(default_factory=list)
