"""Contratos del dashboard financiero agregado."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from financiera_api.budget_schemas import BudgetOverview


class DashboardMonth(BaseModel):
    period_start: date
    income: Decimal
    expenses: Decimal
    balance: Decimal


class DashboardRecentTransaction(BaseModel):
    id: str
    effective_date: date
    description: str
    transaction_type: str
    category_name: str | None = None
    amount: Decimal


class DashboardOverview(BaseModel):
    period_start: date
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    available: Decimal
    active_accounts: int = Field(ge=0)
    income: Decimal
    expenses: Decimal
    balance: Decimal
    budget: BudgetOverview
    monthly: list[DashboardMonth] = Field(default_factory=list)
    recent_transactions: list[DashboardRecentTransaction] = Field(default_factory=list)
