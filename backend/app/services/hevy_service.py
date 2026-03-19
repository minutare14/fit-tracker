from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import IntegrationNotConfiguredError
from app.integrations.hevy.client import HevyClient
from app.models.integration import IntegrationProvider, SyncStatus
from app.repositories.hevy_repository import HevyRepository
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.hevy import HevyConnectionCreate, HevyStatusRead, HevySyncResult
from app.services.metrics_service import MetricsService
from app.services.secret_service import SecretService


class HevyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)
        self.hevy_repository = HevyRepository(session)
        self.metrics_service = MetricsService(session)
        self.secret_service = SecretService(session)

    async def configure_connection(self, payload: HevyConnectionCreate) -> HevyStatusRead:
        await self.integration_repository.ensure_user(payload.user_id)
        client = HevyClient(payload.api_key)
        is_valid = await client.validate_connection()
        await self.secret_service.save_secret(payload.user_id, IntegrationProvider.HEVY, "API_KEY", payload.api_key)
        await self.integration_repository.upsert_connection(
            payload.user_id,
            IntegrationProvider.HEVY,
            status="CONNECTED" if is_valid else "ERROR",
            external_user_id=payload.external_user_id,
            last_error=None if is_valid else "Invalid Hevy API key",
        )
        await self.session.commit()
        return await self.get_status(payload.user_id)

    async def get_status(self, user_id: str) -> HevyStatusRead:
        await self.integration_repository.ensure_user(user_id)
        connection = await self.integration_repository.get_connection(user_id, IntegrationProvider.HEVY)
        api_key = await self.secret_service.get_secret(user_id, IntegrationProvider.HEVY, "API_KEY")
        workout_count = await self.hevy_repository.count_workouts(user_id)
        exercise_template_count = await self.hevy_repository.count_exercise_templates()
        return HevyStatusRead(
            user_id=user_id,
            connected=bool(connection and api_key and connection.status == "CONNECTED"),
            status=connection.status if connection else "DISCONNECTED",
            last_synced_at=connection.last_synced_at if connection else None,
            last_error=connection.last_error if connection else None,
            workout_count=workout_count,
            exercise_template_count=exercise_template_count,
        )

    async def sync_exercise_templates(self, user_id: str) -> HevySyncResult:
        connection, client, sync_run = await self._prepare_sync(user_id, "TEMPLATES")
        processed = created = updated = 0

        try:
            page = 1
            while True:
                templates = await client.get_exercise_templates(page=page)
                if not templates:
                    break

                for template in templates:
                    await self.integration_repository.create_raw_event(
                        user_id=user_id,
                        provider=IntegrationProvider.HEVY,
                        event_type="hevy.exercise_template.payload",
                        payload_json=template,
                        external_event_id=template.get("id"),
                    )
                    _, was_created = await self.hevy_repository.upsert_exercise_template(template)
                    processed += 1
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                page += 1

            await self.integration_repository.finish_sync_run(
                sync_run,
                status=SyncStatus.SUCCESS,
                processed=processed,
                created=created,
                updated=updated,
                metadata={"sync_type": "exercise_templates"},
            )
            await self.integration_repository.touch_connection_sync(connection)
            await self.session.commit()
            return HevySyncResult(
                success=True,
                sync_type="exercise_templates",
                processed=processed,
                created=created,
                updated=updated,
                metadata={"mode": "full"},
            )
        except Exception as exc:
            await self.integration_repository.finish_sync_run(
                sync_run,
                status=SyncStatus.FAILURE,
                processed=processed,
                created=created,
                updated=updated,
                error_message=str(exc),
            )
            connection.status = "ERROR"
            connection.last_error = str(exc)
            await self.session.commit()
            raise

    async def sync_workouts(self, user_id: str, mode: str = "delta") -> HevySyncResult:
        connection, client, sync_run = await self._prepare_sync(user_id, "WORKOUTS")
        processed = created = updated = 0
        affected_days = set()

        try:
            page = 1
            while True:
                workouts = await client.get_workouts(page=page)
                if not workouts:
                    break

                for workout in workouts:
                    await self.integration_repository.create_raw_event(
                        user_id=user_id,
                        provider=IntegrationProvider.HEVY,
                        event_type="hevy.workout.payload",
                        payload_json=workout,
                        external_event_id=workout.get("id"),
                    )
                    _, was_created = await self.hevy_repository.upsert_workout(user_id, workout)
                    if workout.get("start_time"):
                        affected_days.add(workout["start_time"])
                    processed += 1
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                page += 1

            for start_time in affected_days:
                await self.metrics_service.refresh_daily_rollup(
                    user_id,
                    datetime.fromisoformat(start_time.replace("Z", "+00:00")),
                )

            await self.integration_repository.finish_sync_run(
                sync_run,
                status=SyncStatus.SUCCESS,
                processed=processed,
                created=created,
                updated=updated,
                metadata={"sync_type": "workouts", "mode": mode},
            )
            await self.integration_repository.touch_connection_sync(connection)
            await self.session.commit()
            return HevySyncResult(
                success=True,
                sync_type="workouts",
                processed=processed,
                created=created,
                updated=updated,
                metadata={"mode": mode},
            )
        except Exception as exc:
            await self.integration_repository.finish_sync_run(
                sync_run,
                status=SyncStatus.FAILURE,
                processed=processed,
                created=created,
                updated=updated,
                error_message=str(exc),
            )
            connection.status = "ERROR"
            connection.last_error = str(exc)
            await self.session.commit()
            raise

    async def list_exercise_templates(self, user_id: str, search: str | None) -> list:
        await self.integration_repository.ensure_user(user_id)
        return await self.hevy_repository.list_exercise_templates(search)

    async def list_workouts(self, user_id: str, limit: int) -> list:
        await self.integration_repository.ensure_user(user_id)
        return await self.hevy_repository.list_workouts(user_id, limit)

    async def _prepare_sync(self, user_id: str, sync_type: str):
        await self.integration_repository.ensure_user(user_id)
        connection = await self.integration_repository.get_connection(user_id, IntegrationProvider.HEVY)
        api_key = await self.secret_service.get_secret(user_id, IntegrationProvider.HEVY, "API_KEY")
        if not connection or not api_key:
            raise IntegrationNotConfiguredError("Hevy integration is not configured")

        client = HevyClient(api_key)
        sync_run = await self.integration_repository.create_sync_run(
            user_id=user_id,
            connection_id=connection.id,
            provider=IntegrationProvider.HEVY,
            sync_type=sync_type,
        )
        return connection, client, sync_run
