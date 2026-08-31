"""Contratos de importacion y reglas automaticas."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

ImportSourceType = Literal["csv", "excel_csv"]
ImportRowStatus = Literal["pending", "ready", "invalid", "duplicate", "imported"]


class ImportBatchCreate(BaseModel):
    account_id: str
    file_name: str = Field(min_length=1, max_length=180)
    source_type: ImportSourceType


class ImportRowPreview(BaseModel):
    row_number: int = Field(gt=0)
    effective_date: date | None = None
    description: str | None = Field(default=None, max_length=240)
    amount: Decimal | None = Field(default=None, max_digits=20, decimal_places=4)
    transaction_type: Literal["income", "expense"] | None = None
    category_id: str | None = None
    fingerprint: str | None = Field(default=None, max_length=160)
    status: ImportRowStatus
    error_message: str | None = Field(default=None, max_length=240)


class CategorizationRuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    match_text: str = Field(min_length=1, max_length=120)
    transaction_type: Literal["income", "expense"] | None = None
    category_id: str
    priority: int = Field(default=100, ge=1, le=9999)


class CategorizationRuleResponse(CategorizationRuleCreate):
    id: str
    is_active: bool
    created_at: datetime | None = None
