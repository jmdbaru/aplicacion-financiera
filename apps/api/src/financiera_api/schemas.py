"""Contratos comunes de la API versionada."""

from typing import Any

from pydantic import BaseModel, Field, model_validator


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    environment: str = Field(examples=["local"])


class ProfileResponse(BaseModel):
    display_name: str | None = Field(default=None, examples=["Tu espacio"])
    currency_code: str = Field(examples=["EUR"])
    locale: str = Field(examples=["es-ES"])
    time_zone: str = Field(examples=["Europe/Madrid"])


class ProfileUpdateRequest(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    currency_code: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    locale: str | None = Field(default=None, pattern=r"^[a-z]{2}-[A-Z]{2}$")
    time_zone: str | None = Field(default=None, min_length=1, max_length=64)

    @model_validator(mode="after")
    def has_at_least_one_value(self) -> "ProfileUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("Indica al menos una preferencia para actualizar.")
        return self


class ErrorResponse(BaseModel):
    code: str = Field(examples=["validation_error"])
    message: str = Field(examples=["La solicitud no es válida."])
    request_id: str | None = Field(default=None, examples=["a1b2c3d4"])


class ErrorDetail(BaseModel):
    detail: list[dict[str, Any]]
