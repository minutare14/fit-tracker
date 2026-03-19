from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.db.session import async_session_factory
from app.schemas.health_auto_export import HealthAutoExportWebhookPayload, WebhookIngestResult
from app.services.health_auto_export_service import HealthAutoExportService
from app.services.hevy_service import HevyService
from app.services.metrics_service import MetricsService


async def run_hevy_backfill(user_id: str) -> dict[str, int | str | bool | None]:
    async with async_session_factory() as session:
        hevy_service = HevyService(session)
        await hevy_service.sync_exercise_templates(user_id)
        result = await hevy_service.sync_workouts(user_id, mode="full")
        return result.model_dump()


async def run_hevy_incremental_sync(user_id: str) -> dict[str, int | str | bool | None]:
    async with async_session_factory() as session:
        result = await HevyService(session).sync_workouts(user_id, mode="delta")
        return result.model_dump()


async def ingest_autoexport_payload(payload: HealthAutoExportWebhookPayload) -> WebhookIngestResult:
    async with async_session_factory() as session:
        return await HealthAutoExportService(session).ingest(payload)


async def rebuild_derived_metrics(user_id: str, days: int = 30) -> dict[str, int]:
    async with async_session_factory() as session:
        metrics_service = MetricsService(session)
        processed_days = 0
        start_day = datetime.now(timezone.utc) - timedelta(days=max(days - 1, 0))
        for day_offset in range(days):
            current_day = start_day + timedelta(days=day_offset)
            await metrics_service.refresh_daily_rollup(user_id, current_day)
            processed_days += 1
        await session.commit()
        return {"processedDays": processed_days}
