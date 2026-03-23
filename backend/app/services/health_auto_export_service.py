from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.health_auto_export.parser import HealthAutoExportParser
from app.models.integration import IntegrationProvider, SyncStatus
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
        connection = await self.integration_repository.get_connection(payload.user_id, IntegrationProvider.HEALTH_AUTO_EXPORT)
        if connection is None:
            connection = await self.integration_repository.upsert_connection(
                payload.user_id,
                IntegrationProvider.HEALTH_AUTO_EXPORT,
                status="CONNECTED",
                last_error=None,
            )
            await self.session.flush()

        sync_run = await self.integration_repository.create_sync_run(
            user_id=payload.user_id,
            connection_id=connection.id,
            provider=IntegrationProvider.HEALTH_AUTO_EXPORT,
            sync_type="WEBHOOK_INGEST",
        )
        await self.integration_repository.create_raw_event(
            user_id=payload.user_id,
            provider=IntegrationProvider.HEALTH_AUTO_EXPORT,
            event_type="health_auto_export.webhook",
            payload_json=payload.model_dump(mode="json"),
        )

        processed = 0
        errors = 0
        affected_days: set[datetime] = set()
        nutrition_by_day: dict[datetime, dict] = {}
        nutrition_field_map = {
            "Calories": "calories",
            "Protein": "protein",
            "Carbs": "carbs",
            "Fat": "fat",
            "Fiber": "fiber",
            "Water": "water_liters",
        }

        for metric in HealthAutoExportParser.extract_metrics(payload):
            normalized_name = HealthAutoExportParser.normalize_metric_name(metric.name)
            if not normalized_name:
                continue

            for entry in metric.data:
                raw_value = entry.qty if entry.qty is not None else entry.value if entry.value is not None else entry.avg
                if raw_value is None:
                    continue

                try:
                    day = datetime.combine(entry.date.date(), datetime.min.time(), tzinfo=timezone.utc)
                    if normalized_name in nutrition_field_map:
                        nutrition_payload = nutrition_by_day.setdefault(
                            day,
                            {
                                "calories": 0,
                                "protein": 0,
                                "carbs": 0,
                                "fat": 0,
                                "fiber": None,
                                "water_liters": 0,
                                "adherent": False,
                                "source": IntegrationProvider.HEALTH_AUTO_EXPORT,
                                "notes": None,
                            },
                        )
                        nutrition_payload[nutrition_field_map[normalized_name]] = float(raw_value)
                    else:
                        await self.wellness_repository.upsert_health_metric(
                            user_id=payload.user_id,
                            metric_type=normalized_name,
                            value=float(raw_value),
                            unit=metric.units,
                            source=IntegrationProvider.HEALTH_AUTO_EXPORT,
                            date=entry.date,
                        )
                    affected_days.add(entry.date)
                    processed += 1
                except Exception:
                    errors += 1

        for day, nutrition_payload in nutrition_by_day.items():
            await self.wellness_repository.upsert_nutrition_daily(payload.user_id, day, nutrition_payload)
            affected_days.add(day)

        for day in affected_days:
            await self.metrics_service.refresh_daily_rollup(payload.user_id, day)

        await self.integration_repository.finish_sync_run(
            sync_run,
            status=SyncStatus.SUCCESS if errors == 0 else SyncStatus.FAILURE,
            processed=processed,
            created=0,
            updated=processed,
            metadata={"payloadMetrics": len(payload.data.metrics)},
            error_message=None if errors == 0 else f"{errors} entries failed during ingest",
        )
        await self.integration_repository.touch_connection_sync(
            connection,
            error=None if errors == 0 else f"{errors} entries failed during ingest",
        )
        await self.session.commit()
        return WebhookIngestResult(success=errors == 0, processed=processed, errors=errors)
