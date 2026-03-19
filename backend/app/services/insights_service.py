from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hevy import HevyWorkout
from app.models.performance import BjjSession, DerivedMetric
from app.models.wellness import HealthMetric, NutritionDaily
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.insights import InsightsOverviewRead


class InsightsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_overview(self, user_id: str) -> InsightsOverviewRead:
        await self.integration_repository.ensure_user(user_id)
        last_30_days = datetime.now(timezone.utc) - timedelta(days=30)
        last_14_days = datetime.now(timezone.utc) - timedelta(days=14)

        bjj_count = int(
            await self.session.scalar(
                select(func.count()).select_from(BjjSession).where(BjjSession.user_id == user_id, BjjSession.date >= last_30_days)
            )
            or 0
        )
        strength_count = int(
            await self.session.scalar(
                select(func.count()).select_from(HevyWorkout).where(HevyWorkout.user_id == user_id, HevyWorkout.started_at >= last_30_days)
            )
            or 0
        )
        health_count = int(
            await self.session.scalar(
                select(func.count()).select_from(HealthMetric).where(HealthMetric.user_id == user_id, HealthMetric.date >= last_14_days)
            )
            or 0
        )
        nutrition_count = int(
            await self.session.scalar(
                select(func.count()).select_from(NutritionDaily).where(NutritionDaily.user_id == user_id, NutritionDaily.date >= last_14_days)
            )
            or 0
        )
        latest_derived = (
            await self.session.execute(
                select(DerivedMetric)
                .where(DerivedMetric.user_id == user_id)
                .order_by(DerivedMetric.date.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        data_gaps: list[str] = []
        if bjj_count < 3:
            data_gaps.append("Poucas sessoes de BJJ registradas nos ultimos 30 dias.")
        if strength_count < 2:
            data_gaps.append("Base de treinos de forca ainda curta para cruzamentos.")
        if health_count < 5:
            data_gaps.append("Sinais de saude insuficientes para inferir tendencias confiaveis.")
        if nutrition_count < 3:
            data_gaps.append("Historico nutricional incompleto para correlacao real.")

        recommendations: list[str] = []
        if data_gaps:
            recommendations.append("Complete as fontes faltantes antes de confiar em inferencias automaticas.")
        if latest_derived and latest_derived.readiness_score is not None and latest_derived.readiness_score < 65:
            recommendations.append("A readiness recente esta baixa. Priorize recuperacao antes de aumentar carga.")
        if latest_derived and latest_derived.acwr is not None and latest_derived.acwr > 1.5:
            recommendations.append("O ACWR esta elevado. Revise a distribuicao de carga nas proximas sessoes.")
        if not recommendations:
            recommendations.append("As fontes principais estao consistentes. O proximo passo e aprofundar visualizacoes.")

        return InsightsOverviewRead(
            readiness=latest_derived.readiness_score if latest_derived else None,
            weekly_load=latest_derived.daily_load if latest_derived else 0,
            bjj_sessions_last_30_days=bjj_count,
            strength_sessions_last_30_days=strength_count,
            health_records_last_14_days=health_count,
            nutrition_logs_last_14_days=nutrition_count,
            data_gaps=data_gaps,
            recommendations=recommendations,
            has_enough_data=not data_gaps,
        )
