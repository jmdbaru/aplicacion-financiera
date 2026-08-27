"""Contratos de categorías y presupuestos mensuales."""

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

CategoryType = Literal["expense", "income", "both"]
BudgetStatus = Literal["ok", "warning", "exceeded"]


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: CategoryType
    icon: str = Field(default="tag", min_length=1, max_length=50)
    color: str = Field(default="#6B7280", pattern=r"^#[0-9A-Fa-f]{6}$")
    parent_id: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    icon: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    parent_id: str | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_empty_update(self) -> "CategoryUpdate":
        if not self.model_fields_set:
            raise ValueError("Indica al menos un cambio.")
        return self


class CategoryResponse(BaseModel):
    id: str
    name: str
    type: CategoryType
    icon: str
    color: str
    parent_id: str | None = None
    is_default: bool
    is_active: bool
    user_id: str | None = None


class BudgetCreate(BaseModel):
    category_id: str
    period_start: date
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    amount: Decimal = Field(gt=0, max_digits=20, decimal_places=4)
    alert_threshold_pct: int = Field(default=80, ge=1, le=100)

    @model_validator(mode="after")
    def require_first_day(self) -> "BudgetCreate":
        if self.period_start.day != 1:
            raise ValueError("El periodo debe comenzar el primer día del mes.")
        return self


class BudgetUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0, max_digits=20, decimal_places=4)
    alert_threshold_pct: int | None = Field(default=None, ge=1, le=100)

    @model_validator(mode="after")
    def reject_empty_update(self) -> "BudgetUpdate":
        if not self.model_fields_set:
            raise ValueError("Indica al menos un cambio.")
        return self


class BudgetResponse(BaseModel):
    id: str
    category_id: str
    period_start: date
    currency_code: str
    amount: Decimal
    alert_threshold_pct: int


class BudgetProgressItem(BaseModel):
    id: str
    category_id: str
    category_name: str
    icon: str
    color: str
    amount: Decimal
    alert_threshold_pct: int
    spent: Decimal
    remaining: Decimal
    usage_pct: Decimal
    status: BudgetStatus


class BudgetOverview(BaseModel):
    period_start: date
    currency_code: str
    total_budget: Decimal
    budgeted_spent: Decimal
    outside_budget_spent: Decimal
    items: list[BudgetProgressItem] = Field(default_factory=list)
