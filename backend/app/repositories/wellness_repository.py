from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.models.daily_rollup import DailyRollup
from app.models.integration import IntegrationProvider
from app.models.wellness import HealthMetric, NutritionDaily
from app.repositories.base import BaseRepository


class WellnessRepository(BaseRepository):
    async def upsert_health_metric(
        self,
        *,
        user_id: str,
        metric_type: str,
        value: float,
        unit: str,
        source: IntegrationProvider,
        date: datetime,
        external_id: str | None = None,
    ) -> None:
        stmt = insert(HealthMetric).values(
            user_id=user_id,
            date=date,
            type=metric_type,
            value=value,
            unit=unit,
            source=source,
            external_id=external_id,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "date", "type"],
            set_={"value": value, "unit": unit, "source": source, "external_id": external_id},
        )
        await self.session.execute(stmt)

    async def list_health_metrics_for_day(self, user_id: str, day: datetime) -> list[HealthMetric]:
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        query = select(HealthMetric).where(
            HealthMetric.user_id == user_id,
            HealthMetric.date >= start,
            HealthMetric.date < end,
        )
        return list((await self.session.execute(query)).scalars().all())

    async def upsert_nutrition_daily(self, user_id: str, day: datetime, payload: dict) -> None:
        stmt = insert(NutritionDaily).values(user_id=user_id, date=day, **payload)
        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "date"],
            set_=payload | {"updated_at": func.now()},
        )
        await self.session.execute(stmt)

    async def upsert_daily_rollup(self, user_id: str, day: datetime, payload: dict) -> DailyRollup:
        stmt = insert(DailyRollup).values(user_id=user_id, date=day, **payload)
        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "date"],
            set_=payload | {"updated_at": func.now()},
        ).returning(DailyRollup)
        return (await self.session.execute(stmt)).scalar_one()

    async def list_daily_rollups(self, user_id: str, days: int) -> list[DailyRollup]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query = (
            select(DailyRollup)
            .where(DailyRollup.user_id == user_id, DailyRollup.date >= since)
            .order_by(DailyRollup.date.asc())
        )
        return list((await self.session.execute(query)).scalars().all())
