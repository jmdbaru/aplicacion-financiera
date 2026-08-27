"""Configuración validada de la API."""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Valores de entorno seguros y explícitos."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["local", "staging", "production"] = "local"
    cors_allowed_origins: str = "http://localhost:5173"

    @field_validator("cors_allowed_origins")
    @classmethod
    def validate_allowed_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if not origins:
            raise ValueError("CORS_ALLOWED_ORIGINS debe incluir al menos un origen.")
        if "*" in origins:
            raise ValueError("No se permite el comodín CORS.")
        if any(not origin.startswith(("http://", "https://")) for origin in origins):
            raise ValueError("Cada origen CORS debe incluir http:// o https://.")
        return ",".join(origins)

    @property
    def cors_origins(self) -> list[str]:
        return self.cors_allowed_origins.split(",")


@lru_cache
def get_settings() -> Settings:
    return Settings()

