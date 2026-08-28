"""Contratos de reglas recurrentes y su calendario."""
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

RecurringFrequency = Literal["daily", "weekly", "monthly"]
RecurringType = Literal["income", "expense", "transfer", "adjustment"]

class RecurringRuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    transaction_type: RecurringType
    account_id: str
    destination_account_id: str | None = None
    category_id: str | None = None
    currency_code: str = Field(pattern=r"^[A-Z]{3}$")
    amount: Decimal = Field(gt=0, max_digits=20, decimal_places=4)
    adjustment_direction: Literal["credit", "debit"] | None = None
    frequency: RecurringFrequency
    interval_count: int = Field(default=1, ge=1, le=12)
    weekday: int | None = Field(default=None, ge=0, le=6)
    monthly_day: int | None = Field(default=None, ge=1, le=31)
    next_run_on: date
    end_on: date | None = None
    time_zone: str = Field(default="Europe/Madrid", min_length=1, max_length=64)

    @model_validator(mode="after")
    def validate_schedule(self) -> "RecurringRuleCreate":
        if (self.transaction_type == "transfer") != (self.destination_account_id is not None):
            raise ValueError("Una transferencia requiere cuenta destino y solo ella.")
        if (self.transaction_type == "adjustment") != (self.adjustment_direction is not None):
            raise ValueError("Un ajuste requiere dirección y solo ella.")
        if self.frequency == "weekly" and self.weekday is None:
            raise ValueError("La frecuencia semanal requiere día de la semana.")
        if self.frequency == "monthly" and self.monthly_day is None:
            raise ValueError("La frecuencia mensual requiere día ancla.")
        if self.end_on and self.end_on < self.next_run_on:
            raise ValueError("La fecha final no puede preceder a la próxima ejecución.")
        return self

class RecurringRuleResponse(RecurringRuleCreate):
    id: str
    is_active: bool

class RecurringGeneration(BaseModel):
    created: int = Field(ge=0)
