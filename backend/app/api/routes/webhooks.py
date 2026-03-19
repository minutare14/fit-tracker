from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.core.config import settings
from app.schemas.health_auto_export import HealthAutoExportWebhookPayload, WebhookIngestResult
from app.services.health_auto_export_service import HealthAutoExportService

router = APIRouter()


@router.post("/health-auto-export", response_model=WebhookIngestResult)
async def ingest_health_auto_export(
    payload: HealthAutoExportWebhookPayload,
    session: AsyncSession = Depends(get_db_session),
    x_webhook_secret: str | None = Header(default=None),
) -> WebhookIngestResult:
    if settings.health_auto_export_secret and x_webhook_secret != settings.health_auto_export_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")

    return await HealthAutoExportService(session).ingest(payload)
