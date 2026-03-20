from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.performance import WeightEntry
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.weight import (
    WeightEntryCreate,
    WeightEntryRead,
    WeightOverviewRead,
    WeightStatsRead,
)


class WeightService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_overview(self, user_id: str) -> WeightOverviewRead:
        await self.integration_repository.ensure_user(user_id)
        entries = await self._list_entries(user_id)
        stats = self._compute_stats(entries)
        items = [self._serialize(row) for row in entries]
        return WeightOverviewRead(entries=items, stats=stats)

    async def list_entries(self, user_id: str) -> list[WeightEntryRead]:
        await self.integration_repository.ensure_user(user_id)
        entries = await self._list_entries(user_id)
        return [self._serialize(row) for row in entries]

    async def create_entry(self, payload: WeightEntryCreate) -> WeightEntryRead:
        await self.integration_repository.ensure_user(payload.user_id)
        entry = WeightEntry(
            user_id=payload.user_id,
            date=datetime.combine(payload.date, time(hour=12), tzinfo=timezone.utc),
            weight_kg=payload.weight_kg,
            body_fat_pct=payload.body_fat_pct,
            notes=payload.notes,
            source=payload.source,
        )
        self.session.add(entry)
        await self.session.commit()
        await self.session.refresh(entry)
        return self._serialize(entry)

    async def delete_entry(self, user_id: str, entry_id: str) -> None:
        query = select(WeightEntry).where(
            and_(WeightEntry.user_id == user_id, WeightEntry.id == entry_id)
        )
        row = (await self.session.execute(query)).scalar_one_or_none()
        if not row:
            raise NotFoundError("WEIGHT_ENTRY_NOT_FOUND", "Weight entry was not found")
        await self.session.delete(row)
        await self.session.commit()

    async def _list_entries(self, user_id: str) -> list[WeightEntry]:
        query = (
            select(WeightEntry)
            .where(WeightEntry.user_id == user_id)
            .order_by(WeightEntry.date.desc())
        )
        return list((await self.session.execute(query)).scalars().all())

    def _compute_stats(self, entries: list[WeightEntry]) -> WeightStatsRead:
        if not entries:
            return WeightStatsRead()

        current = entries[0]
        previous = entries[1] if len(entries) > 1 else None
        
        cutoff_7d = datetime.now(timezone.utc) - timedelta(days=7)
        recent = [e for e in entries if e.date >= cutoff_7d]
        avg_7d = round(sum(e.weight_kg for e in recent) / len(recent), 1) if recent else None

        trend = None
        diff = None
        if previous is not None:
            trend = "up" if current.weight_kg > previous.weight_kg else "down" if current.weight_kg < previous.weight_kg else "stable"
            diff = round(abs(current.weight_kg - previous.weight_kg), 1)

        return WeightStatsRead(
            current_weight=current.weight_kg,
            current_body_fat=current.body_fat_pct,
            previous_weight=previous.weight_kg if previous else None,
            previous_date=previous.date.date() if previous else None,
            avg_7d=avg_7d,
            trend=trend,
            diff=diff,
            total_entries=len(entries),
        )

    def _serialize(self, row: WeightEntry) -> WeightEntryRead:
        return WeightEntryRead(
            id=row.id,
            date=row.date.date(),
            weight_kg=row.weight_kg,
            body_fat_pct=row.body_fat_pct,
            notes=row.notes,
            source=row.source,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
