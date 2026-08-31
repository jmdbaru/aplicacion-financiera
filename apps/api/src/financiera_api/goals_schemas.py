"""Contratos de objetivos de ahorro."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

GoalStatus = Literal["active", "completed", "archived"]


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    target_amount: Decimal = Field(gt=0, max_digits=20, decimal_places=4)
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    target_date: date | None = None


class GoalStatusUpdate(BaseModel):
    status: GoalStatus


class GoalResponse(BaseModel):
    id: str
    name: str
    target_amount: Decimal
    currency_code: str
    target_date: date | None = None
    status: GoalStatus
    created_at: datetime | None = None


class ContributionCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=20, decimal_places=4)
    contributed_on: date | None = None
    note: str | None = Field(default=None, max_length=240)


class ContributionResponse(BaseModel):
    id: str
    goal_id: str
    amount: Decimal
    contributed_on: date
    note: str | None = None
