"""Contratos comunes de la API versionada."""

from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    environment: str = Field(examples=["local"])


class ErrorResponse(BaseModel):
    code: str = Field(examples=["validation_error"])
    message: str = Field(examples=["La solicitud no es válida."])
    request_id: str | None = Field(default=None, examples=["a1b2c3d4"])


class ErrorDetail(BaseModel):
    detail: list[dict[str, Any]]

