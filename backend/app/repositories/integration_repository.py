from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.models.integration import IntegrationConnection, IntegrationProvider, RawEvent, SyncRun, SyncStatus
from app.models.user import User
from app.repositories.base import BaseRepository


class IntegrationRepository(BaseRepository):
    async def ensure_user(self, user_id: str) -> User:
        user = await self.session.get(User, user_id)
        if user:
            return user

        user = User(id=user_id, email=f"{user_id}@local.invalid", name=user_id)
        self.session.add(user)
        await self.session.flush()
        return user

    async def upsert_connection(
        self,
        user_id: str,
        provider: IntegrationProvider,
        *,
        status: str,
        api_key: str | None = None,
        external_user_id: str | None = None,
        last_error: str | None = None,
    ) -> IntegrationConnection:
        stmt = insert(IntegrationConnection).values(
            user_id=user_id,
            provider=provider,
            status=status,
            api_key=api_key,
            external_user_id=external_user_id,
            last_error=last_error,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "provider"],
            set_={
                "status": status,
                "api_key": api_key,
                "external_user_id": external_user_id,
                "last_error": last_error,
                "updated_at": func.now(),
            },
        ).returning(IntegrationConnection)
        return (await self.session.execute(stmt)).scalar_one()

    async def get_connection(
        self,
        user_id: str,
        provider: IntegrationProvider,
    ) -> IntegrationConnection | None:
        query = select(IntegrationConnection).where(
            IntegrationConnection.user_id == user_id,
            IntegrationConnection.provider == provider,
        )
        return (await self.session.execute(query)).scalar_one_or_none()

    async def create_sync_run(
        self,
        *,
        user_id: str,
        connection_id: str,
        provider: IntegrationProvider,
        sync_type: str,
    ) -> SyncRun:
        sync_run = SyncRun(
            user_id=user_id,
            connection_id=connection_id,
            provider=provider,
            sync_type=sync_type,
            status=SyncStatus.IN_PROGRESS,
            started_at=datetime.now(timezone.utc),
        )
        self.session.add(sync_run)
        await self.session.flush()
        return sync_run

    async def finish_sync_run(
        self,
        sync_run: SyncRun,
        *,
        status: SyncStatus,
        processed: int,
        created: int,
        updated: int,
        metadata: dict | None = None,
        error_message: str | None = None,
    ) -> None:
        sync_run.status = status
        sync_run.finished_at = datetime.now(timezone.utc)
        sync_run.records_processed = processed
        sync_run.records_created = created
        sync_run.records_updated = updated
        sync_run.metadata_json = metadata
        sync_run.error_message = error_message

    async def touch_connection_sync(
        self,
        connection: IntegrationConnection,
        *,
        error: str | None = None,
    ) -> None:
        connection.last_synced_at = datetime.now(timezone.utc)
        connection.last_error = error
        connection.status = "ERROR" if error else "CONNECTED"

    async def create_raw_event(
        self,
        *,
        user_id: str | None,
        provider: IntegrationProvider,
        event_type: str,
        payload_json: dict,
        external_event_id: str | None = None,
        status: str = "RECEIVED",
    ) -> RawEvent:
        raw_event = RawEvent(
            user_id=user_id,
            provider=provider,
            event_type=event_type,
            external_event_id=external_event_id,
            payload_json=payload_json,
            status=status,
            received_at=datetime.now(timezone.utc),
        )
        self.session.add(raw_event)
        await self.session.flush()
        return raw_event
