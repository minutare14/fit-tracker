from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.health_auto_export.parser import HealthAutoExportParser
from app.models.integration import IntegrationProvider
from app.repositories.integration_repository import IntegrationRepository
from app.repositories.wellness_repository import WellnessRepository
from app.schemas.health_auto_export import HealthAutoExportWebhookPayload, WebhookIngestResult
from app.services.metrics_service import MetricsService


class HealthAutoExportService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)
        self.wellness_repository = WellnessRepository(session)
        self.metrics_service = MetricsService(session)

    async def ingest(self, payload: HealthAutoExportWebhookPayload) -> WebhookIngestResult:
        await self.integration_repository.ensure_user(payload.user_id)
        await self.integration_repository.create_raw_event(
            user_id=payload.user_id,
            provider=IntegrationProvider.HEALTH_AUTO_EXPORT,
            event_type="health_auto_export.webhook",
            payload_json=payload.model_dump(mode="json"),
        )

        processed = 0
        errors = 0

        for metric in HealthAutoExportParser.extract_metrics(payload):
            normalized_name = HealthAutoExportParser.normalize_metric_name(metric.name)
            if not normalized_name:
                continue

            for entry in metric.data:
                raw_value = entry.qty if entry.qty is not None else entry.value if entry.value is not None else entry.avg
                if raw_value is None:
                    continue
                try:
                    await self.wellness_repository.upsert_health_metric(
                        user_id=payload.user_id,
                        metric_type=normalized_name,
                        value=float(raw_value),
                        unit=metric.units,
                        source=IntegrationProvider.HEALTH_AUTO_EXPORT,
                        date=entry.date,
                    )
                    await self.metrics_service.refresh_daily_rollup(payload.user_id, entry.date)
                    processed += 1
                except Exception:
                    errors += 1

        await self.session.commit()
        connection = await self.integration_repository.get_connection(payload.user_id, IntegrationProvider.HEALTH_AUTO_EXPORT)
        if connection:
            await self.integration_repository.touch_connection_sync(connection)
            await self.session.commit()
        return WebhookIngestResult(success=errors == 0, processed=processed, errors=errors)
