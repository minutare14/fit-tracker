from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.core.config import settings
from app.core.errors import AppError
from app.models.integration import IntegrationProvider
from app.schemas.health_auto_export import HealthAutoExportWebhookPayload, WebhookIngestResult
from app.services.health_auto_export_service import HealthAutoExportService
from app.services.secret_service import SecretService

router = APIRouter()


@router.post("/health/autoexport", response_model=WebhookIngestResult)
async def ingest_health_auto_export(
    request: Request,
    payload: HealthAutoExportWebhookPayload,
    session: AsyncSession = Depends(get_db_session),
) -> WebhookIngestResult:
    secret_service = SecretService(session)
    header_name = await secret_service.get_secret(
        payload.user_id,
        IntegrationProvider.HEALTH_AUTO_EXPORT,
        "HEADER_NAME",
    )
    configured_secret = await secret_service.get_secret(
        payload.user_id,
        IntegrationProvider.HEALTH_AUTO_EXPORT,
        "WEBHOOK_SECRET",
    )
    request_secret = request.headers.get(header_name or "x-health-autoexport-secret")

    if configured_secret and request_secret != configured_secret:
        raise AppError(
            code="INVALID_WEBHOOK_SECRET",
            message="Invalid webhook secret",
            status_code=401,
        )
    if not configured_secret and settings.health_auto_export_secret and request_secret != settings.health_auto_export_secret:
        raise AppError(
            code="INVALID_WEBHOOK_SECRET",
            message="Invalid webhook secret",
            status_code=401,
        )

    return await HealthAutoExportService(session).ingest(payload)
