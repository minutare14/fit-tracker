from __future__ import annotations

from datetime import datetime, timedelta, timezone
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wellness import NutritionDaily
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.nutrition import NutritionOverviewRead, NutritionStatsRead, NutritionLogRead


class NutritionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_overview(self, user_id: str) -> NutritionOverviewRead:
        await self.integration_repository.ensure_user(user_id)
        
        # Obter os últimos 7 registros (mocked em caso de não haver suficientes, mas query real no DB)
        query = (
            select(NutritionDaily)
            .where(NutritionDaily.user_id == user_id)
            .order_by(NutritionDaily.date.desc())
            .limit(7)
        )
        recent_entries = list((await self.session.execute(query)).scalars().all())

        total_tracked_days = int(
            await self.session.scalar(
                select(func.count()).select_from(NutritionDaily).where(NutritionDaily.user_id == user_id)
            )
            or 0
        )

        avg_calories_7d = 0
        adherence_rate_7d = 0
        macros_hit_7d = 0

        if recent_entries:
            avg_calories_7d = sum(e.calories_in or 0 for e in recent_entries) / len(recent_entries)
            adherent_days = sum(1 for e in recent_entries if e.is_adherent)
            adherence_rate_7d = int((adherent_days / len(recent_entries)) * 100)
            macros_hit_7d = adherent_days # Simplificação

        recent_logs = []
        for e in recent_entries:
            recent_logs.append(
                NutritionLogRead(
                    date=e.date,
                    calories=e.calories_in or 0,
                    protein=e.protein_g or 0,
                    carbs=e.carbs_g or 0,
                    fat=e.fat_g or 0,
                    water_liters=e.water_liters or 0.0,
                    is_adherent=e.is_adherent or False
                )
            )

        return NutritionOverviewRead(
            recent_logs=recent_logs,
            stats=NutritionStatsRead(
                avg_calories_7d=avg_calories_7d,
                adherence_rate_7d=adherence_rate_7d,
                macros_hit_7d=macros_hit_7d,
                total_tracked_days=total_tracked_days
            )
        )
