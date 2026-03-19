from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@dataclass(slots=True)
class AppError(Exception):
    code: str
    message: str
    status_code: int = 400
    details: Any | None = None


class NotFoundError(AppError):
    def __init__(self, code: str, message: str, details: Any | None = None) -> None:
        super().__init__(code=code, message=message, status_code=404, details=details)


class IntegrationNotConfiguredError(AppError):
    def __init__(self, message: str = "Integration is not configured") -> None:
        super().__init__(
            code="INTEGRATION_NOT_CONFIGURED",
            message=message,
            status_code=400,
        )


def build_error_response(
    request: Request,
    *,
    code: str,
    message: str,
    status_code: int,
    details: Any | None = None,
):
    request_id = getattr(request.state, "request_id", None)
    payload = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }
    headers = {"x-request-id": request_id} if request_id else None
    return JSONResponse(status_code=status_code, content=payload, headers=headers)


async def app_error_handler(request: Request, exc: AppError):
    return build_error_response(
        request,
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request failed"
    return build_error_response(
        request,
        code=f"HTTP_{exc.status_code}",
        message=message,
        status_code=exc.status_code,
        details=None if isinstance(detail, str) else detail,
    )


async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    return build_error_response(
        request,
        code="VALIDATION_ERROR",
        message="Request payload is invalid",
        status_code=422,
        details=exc.errors(),
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    return build_error_response(
        request,
        code="INTERNAL_SERVER_ERROR",
        message="Internal server error",
        status_code=500,
        details=None,
    )
