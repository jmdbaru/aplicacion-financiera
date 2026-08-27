"""Punto de entrada y composición de la aplicación FastAPI."""

import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from financiera_api.api import router
from financiera_api.config import get_settings
from financiera_api.schemas import ErrorResponse

logger = logging.getLogger("financiera_api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Reserva para recursos compartidos; no abre conexiones todavía."""
    yield


def create_app() -> FastAPI:
    """Construye la aplicación con políticas comunes y rutas versionadas."""
    settings = get_settings()
    app = FastAPI(
        title="Financiera API",
        version="0.1.0",
        openapi_url="/api/openapi.json",
        docs_url="/api/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    )

    @app.middleware("http")
    async def correlation_id(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex)
        request.state.request_id = request_id
        started_at = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        elapsed_ms = round((time.perf_counter() - started_at) * 1_000, 2)
        logger.info(
            "request_completed method=%s path=%s status=%s elapsed_ms=%s request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            request_id,
        )
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        payload = ErrorResponse(
            code="validation_error",
            message="La solicitud no es válida.",
            request_id=getattr(request.state, "request_id", None),
        )
        return JSONResponse(status_code=422, content=payload.model_dump())

    app.include_router(router)
    return app


app = create_app()

