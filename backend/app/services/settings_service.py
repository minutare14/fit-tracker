from __future__ import annotations

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.integrations.hevy.client import HevyClient
from app.models.hevy import HevyWorkout
from app.models.integration import IntegrationProvider, SyncRun
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.hevy import HevySyncResult
from app.schemas.settings import (
    AISettingsRead,
    AISettingsWrite,
    AutoExportSettingsWrite,
    HealthAutoExportSettingsRead,
    HevySettingsRead,
    HevySettingsWrite,
    HevySyncRequest,
    HevyTestRequest,
    IntegrationLogRead,
    SettingsIntegrationsRead,
)
from app.services.hevy_service import HevyService
from app.services.secret_service import SecretService


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)
        self.secret_service = SecretService(session)
        self.hevy_service = HevyService(session)

    async def get_integrations(self, user_id: str, origin: str) -> SettingsIntegrationsRead:
        await self.integration_repository.ensure_user(user_id)
        hevy_connection = await self.integration_repository.get_connection(user_id, IntegrationProvider.HEVY)
        health_connection = await self.integration_repository.get_connection(user_id, IntegrationProvider.HEALTH_AUTO_EXPORT)
        ai_connection = await self.integration_repository.get_connection(user_id, IntegrationProvider.AI)

        hevy_masked = await self.secret_service.get_masked_secret(user_id, IntegrationProvider.HEVY, "API_KEY")
        health_secret = await self.secret_service.get_masked_secret(user_id, IntegrationProvider.HEALTH_AUTO_EXPORT, "WEBHOOK_SECRET")
        health_header = await self.secret_service.get_secret(user_id, IntegrationProvider.HEALTH_AUTO_EXPORT, "HEADER_NAME")
        ai_masked = await self.secret_service.get_masked_secret(user_id, IntegrationProvider.AI, "API_KEY")
        sync_runs = list(
            (
                await self.session.execute(
                    select(SyncRun)
                    .where(SyncRun.user_id == user_id)
                    .order_by(SyncRun.started_at.desc())
                    .limit(12)
                )
            )
            .scalars()
            .all()
        )
        workouts_imported = int(
            await self.session.scalar(select(func.count()).select_from(HevyWorkout).where(HevyWorkout.user_id == user_id))
            or 0
        )

        ai_credentials = ai_connection.credentials if ai_connection and ai_connection.credentials else {}

        return SettingsIntegrationsRead(
            hevy=HevySettingsRead(
                configured=bool(hevy_connection or hevy_masked),
                status=hevy_connection.status if hevy_connection else "DISCONNECTED",
                last_sync_at=hevy_connection.last_synced_at if hevy_connection else None,
                has_valid_api_key=bool(hevy_masked),
                sync_in_progress=bool(hevy_connection and hevy_connection.status == "SYNCING"),
                workouts_imported=workouts_imported,
                masked_api_key=hevy_masked,
                last_error=hevy_connection.last_error if hevy_connection else None,
            ),
            health_auto_export=HealthAutoExportSettingsRead(
                configured=bool(health_connection or health_secret),
                status=health_connection.status if health_connection else "DISCONNECTED",
                last_payload_at=health_connection.last_synced_at if health_connection else None,
                has_secret=bool(health_secret),
                webhook_url=f"{origin}/api/webhooks/health/autoexport",
                header_name=health_header or "x-health-autoexport-secret",
                secret_mask=health_secret,
                last_error=health_connection.last_error if health_connection else None,
            ),
            ai=AISettingsRead(
                configured=bool(ai_connection or ai_masked),
                provider=str(ai_credentials.get("provider", "openai")),
                model=str(ai_credentials.get("model", "gpt-4.1-mini")),
                has_api_key=bool(ai_masked),
                masked_api_key=ai_masked,
            ),
            sync_history=[
                IntegrationLogRead(
                    id=item.id,
                    provider=item.provider.value if hasattr(item.provider, "value") else str(item.provider),
                    status=item.status.value if hasattr(item.status, "value") else str(item.status),
                    started_at=item.started_at,
                    finished_at=item.finished_at,
                    records_processed=item.records_processed,
                    error_message=item.error_message,
                )
                for item in sync_runs
            ],
        )

    async def save_hevy_settings(self, payload: HevySettingsWrite) -> HevySettingsRead:
        await self.integration_repository.ensure_user(payload.user_id)
        client = HevyClient(payload.api_key)
        is_valid = await client.validate_connection()
        if not is_valid:
            raise AppError(
                code="INTEGRATION_TEST_FAILED",
                message="Unable to validate the provided Hevy API key",
                status_code=400,
            )

        await self.secret_service.save_secret(payload.user_id, IntegrationProvider.HEVY, "API_KEY", payload.api_key)
        await self.integration_repository.upsert_connection(
            payload.user_id,
            IntegrationProvider.HEVY,
            status="CONNECTED",
            last_error=None,
        )
        await self.session.commit()
        return (await self.get_integrations(payload.user_id, "http://localhost")).hevy

    async def test_hevy_settings(self, payload: HevyTestRequest) -> dict[str, bool]:
        await self.integration_repository.ensure_user(payload.user_id)
        api_key = payload.api_key or await self.secret_service.get_secret(
            payload.user_id,
            IntegrationProvider.HEVY,
            "API_KEY",
        )
        if not api_key:
            raise AppError(
                code="INTEGRATION_NOT_CONFIGURED",
                message="Hevy integration is not configured",
                status_code=400,
            )

        client = HevyClient(api_key)
        is_valid = await client.validate_connection()
        if not is_valid:
            raise AppError(
                code="INTEGRATION_TEST_FAILED",
                message="Hevy credentials are invalid",
                status_code=400,
            )
        return {"success": True}

    async def run_hevy_sync(self, payload: HevySyncRequest) -> HevySyncResult:
        if payload.mode == "full":
            await self.hevy_service.sync_exercise_templates(payload.user_id)
        return await self.hevy_service.sync_workouts(payload.user_id, payload.mode)

    async def save_autoexport_settings(
        self,
        payload: AutoExportSettingsWrite,
        origin: str,
    ) -> HealthAutoExportSettingsRead:
        await self.integration_repository.ensure_user(payload.user_id)
        await self.secret_service.save_secret(
            payload.user_id,
            IntegrationProvider.HEALTH_AUTO_EXPORT,
            "WEBHOOK_SECRET",
            payload.webhook_secret,
        )
        await self.secret_service.save_secret(
            payload.user_id,
            IntegrationProvider.HEALTH_AUTO_EXPORT,
            "HEADER_NAME",
            payload.header_name,
        )
        await self.integration_repository.upsert_connection(
            payload.user_id,
            IntegrationProvider.HEALTH_AUTO_EXPORT,
            status="ACTIVE",
            last_error=None,
        )
        await self.session.commit()
        return (await self.get_integrations(payload.user_id, origin)).health_auto_export

    async def save_ai_settings(self, payload: AISettingsWrite) -> AISettingsRead:
        await self.integration_repository.ensure_user(payload.user_id)
        existing = await self.integration_repository.get_connection(payload.user_id, IntegrationProvider.AI)
        credentials = {
            "provider": payload.provider,
            "model": payload.model,
        }
        if payload.api_key:
            await self.secret_service.save_secret(payload.user_id, IntegrationProvider.AI, "API_KEY", payload.api_key)
        await self.integration_repository.upsert_connection(
            payload.user_id,
            IntegrationProvider.AI,
            status=existing.status if existing else "CONNECTED",
            last_error=None,
            credentials=credentials,
        )
        await self.session.commit()
        masked_api_key = await self.secret_service.get_masked_secret(payload.user_id, IntegrationProvider.AI, "API_KEY")
        return AISettingsRead(
            configured=True,
            provider=payload.provider,
            model=payload.model,
            has_api_key=bool(masked_api_key),
            masked_api_key=masked_api_key,
        )
