from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hevy import HevyWorkout
from app.models.performance import BjjSession, DerivedMetric, WeightEntry
from app.models.wellness import HealthMetric, NutritionDaily
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.insights import (
    InsightBlockRead,
    InsightsOverviewRead,
    InsightsReadinessRead,
    LoadRecoveryInsightRead,
    SessionFrequencyInsightRead,
    WeightTrendInsightRead,
)


class InsightsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_overview(self, user_id: str) -> InsightsOverviewRead:
        await self.integration_repository.ensure_user(user_id)
        now = datetime.now(timezone.utc)
        last_7_days = now - timedelta(days=7)
        last_14_days = now - timedelta(days=14)
        last_30_days = now - timedelta(days=30)

        bjj_count_7d = await self._count(BjjSession, BjjSession.user_id == user_id, BjjSession.date >= last_7_days)
        bjj_count_30d = await self._count(BjjSession, BjjSession.user_id == user_id, BjjSession.date >= last_30_days)
        weekly_load = int(
            await self.session.scalar(
                select(func.coalesce(func.sum(BjjSession.session_load), 0)).where(
                    BjjSession.user_id == user_id,
                    BjjSession.date >= last_7_days,
                )
            )
            or 0
        )
        strength_count_30d = await self._count(
            HevyWorkout,
            HevyWorkout.user_id == user_id,
            HevyWorkout.started_at >= last_30_days,
        )
        health_count_14d = await self._count(HealthMetric, HealthMetric.user_id == user_id, HealthMetric.date >= last_14_days)
        nutrition_count_14d = await self._count(
            NutritionDaily,
            NutritionDaily.user_id == user_id,
            NutritionDaily.date >= last_14_days,
        )

        latest_derived = (
            await self.session.execute(
                select(DerivedMetric)
                .where(DerivedMetric.user_id == user_id)
                .order_by(DerivedMetric.date.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        recent_weights = list(
            (
                await self.session.execute(
                    select(WeightEntry)
                    .where(WeightEntry.user_id == user_id)
                    .order_by(WeightEntry.date.desc())
                    .limit(8)
                )
            )
            .scalars()
            .all()
        )

        gaps: list[InsightBlockRead] = []
        if bjj_count_30d < 3:
            gaps.append(InsightBlockRead(title="BJJ insuficiente", detail="Poucas sessoes de BJJ registradas nos ultimos 30 dias.", tone="warning"))
        if strength_count_30d < 2:
            gaps.append(InsightBlockRead(title="Forca insuficiente", detail="Base de treinos de forca ainda curta para cruzamentos.", tone="warning"))
        if health_count_14d < 5:
            gaps.append(InsightBlockRead(title="Saude insuficiente", detail="Sinais de saude insuficientes para inferir tendencias confiaveis.", tone="warning"))
        if nutrition_count_14d < 3:
            gaps.append(InsightBlockRead(title="Nutricao insuficiente", detail="Historico nutricional incompleto para correlacao real.", tone="warning"))

        readiness_detail = InsightsReadinessRead(
            status="available" if latest_derived and latest_derived.readiness_score is not None else "missing",
            score=latest_derived.readiness_score if latest_derived else None,
            explanation=(
                "Readiness derivada a partir das leituras recentes de recuperacao."
                if latest_derived and latest_derived.readiness_score is not None
                else "Readiness indisponivel porque faltam leituras suficientes de HRV e sono."
            ),
            missing_inputs=[] if health_count_14d >= 5 else ["HRV/sono"],
        )

        patterns: list[InsightBlockRead] = []
        if bjj_count_7d >= 3:
            patterns.append(InsightBlockRead(title="Frequencia forte", detail=f"Voce treinou BJJ {bjj_count_7d} vezes nos ultimos 7 dias.", tone="success"))
        if latest_derived and latest_derived.acwr is not None:
            patterns.append(
                InsightBlockRead(
                    title="Carga atual",
                    detail=f"ACWR em {latest_derived.acwr:.2f} com carga aguda de {latest_derived.acute_load or 0:.0f}.",
                    tone="info",
                )
            )
        if recent_weights:
            patterns.append(InsightBlockRead(title="Peso", detail=self._weight_explanation(recent_weights), tone="info"))

        recommendation_blocks: list[InsightBlockRead] = []
        if gaps:
            recommendation_blocks.append(
                InsightBlockRead(
                    title="Completar fontes",
                    detail="Conecte as fontes faltantes antes de confiar em recomendacoes automatizadas mais fortes.",
                    tone="warning",
                )
            )
        if latest_derived and latest_derived.readiness_score is not None and latest_derived.readiness_score < 65:
            recommendation_blocks.append(
                InsightBlockRead(
                    title="Reduzir estresse",
                    detail="Readiness baixa. Priorize recuperacao antes de aumentar a carga.",
                    tone="danger",
                )
            )
        if latest_derived and latest_derived.acwr is not None and latest_derived.acwr > 1.5:
            recommendation_blocks.append(
                InsightBlockRead(
                    title="Segurar progressao",
                    detail="ACWR elevado. Revise a distribuicao da carga nas proximas sessoes.",
                    tone="warning",
                )
            )
        if not recommendation_blocks:
            recommendation_blocks.append(
                InsightBlockRead(
                    title="Base consistente",
                    detail="As fontes principais estao consistentes. O proximo passo e refinar as decisoes operacionais.",
                    tone="success",
                )
            )

        data_impact: list[InsightBlockRead] = []
        if nutrition_count_14d == 0:
            data_impact.append(
                InsightBlockRead(
                    title="Sem nutricao consolidada",
                    detail="Sem dados de nutricao, o sistema nao consegue relacionar aderencia alimentar com peso e recuperacao.",
                    tone="warning",
                )
            )
        if health_count_14d < 5:
            data_impact.append(
                InsightBlockRead(
                    title="Recuperacao parcial",
                    detail="Poucas leituras de saude reduzem a confianca dos sinais de readiness e da relacao carga x recuperacao.",
                    tone="warning",
                )
            )

        load_recovery = LoadRecoveryInsightRead(
            status=(
                "available"
                if latest_derived and latest_derived.acwr is not None and latest_derived.readiness_score is not None
                else "partial"
                if latest_derived
                else "missing"
            ),
            acute_load=latest_derived.acute_load if latest_derived else None,
            chronic_load=latest_derived.chronic_load if latest_derived else None,
            acwr=latest_derived.acwr if latest_derived else None,
            readiness_trend=latest_derived.readiness_score if latest_derived else None,
            explanation=(
                f"Carga aguda/cronica em {latest_derived.acute_load or 0:.0f}/{latest_derived.chronic_load or 0:.0f}."
                if latest_derived and latest_derived.acwr is not None
                else "Ainda nao ha base suficiente para ler a relacao carga x recuperacao com confianca."
            ),
        )

        return InsightsOverviewRead(
            readiness=readiness_detail,
            weekly_load=int(round(latest_derived.acute_load)) if latest_derived and latest_derived.acute_load is not None else weekly_load,
            bjj_sessions_last_30_days=bjj_count_30d,
            strength_sessions_last_30_days=strength_count_30d,
            health_records_last_14_days=health_count_14d,
            nutrition_logs_last_14_days=nutrition_count_14d,
            data_gaps=[item.detail for item in gaps],
            has_enough_data=not gaps,
            patterns=patterns,
            gaps=gaps,
            recommendations=recommendation_blocks,
            data_impact=data_impact,
            load_recovery=load_recovery,
            weight_trend=self._build_weight_trend(recent_weights),
            session_frequency=SessionFrequencyInsightRead(
                status="available" if bjj_count_30d or strength_count_30d else "missing",
                bjj_sessions_last_30_days=bjj_count_30d,
                strength_sessions_last_30_days=strength_count_30d,
                weekly_average=round(bjj_count_30d / 4.0, 1) if bjj_count_30d else None,
                explanation=(
                    f"Media de {round(bjj_count_30d / 4.0, 1)} sessoes de BJJ por semana nos ultimos 30 dias."
                    if bjj_count_30d
                    else "Sem sessoes suficientes para medir frequencia real."
                ),
            ),
        )

    async def _count(self, model, *conditions) -> int:
        return int(await self.session.scalar(select(func.count()).select_from(model).where(*conditions)) or 0)

    def _build_weight_trend(self, recent_weights: list[WeightEntry]) -> WeightTrendInsightRead:
        if not recent_weights:
            return WeightTrendInsightRead(status="missing", explanation="Sem pesagens suficientes para medir tendencia.")

        current = recent_weights[0]
        previous = recent_weights[1] if len(recent_weights) > 1 else None
        avg_7d = round(sum(item.weight_kg for item in recent_weights[:7]) / min(len(recent_weights), 7), 1)
        delta = round(current.weight_kg - previous.weight_kg, 1) if previous else None
        return WeightTrendInsightRead(
            status="available" if previous else "partial",
            current_weight=current.weight_kg,
            previous_weight=previous.weight_kg if previous else None,
            delta_from_previous=delta,
            avg_7d=avg_7d,
            explanation=self._weight_explanation(recent_weights),
        )

    def _weight_explanation(self, recent_weights: list[WeightEntry]) -> str:
        current = recent_weights[0]
        previous = recent_weights[1] if len(recent_weights) > 1 else None
        if not previous:
            return f"Peso atual em {current.weight_kg:.1f} kg, ainda sem base anterior suficiente."
        delta = current.weight_kg - previous.weight_kg
        direction = "subiu" if delta > 0 else "caiu" if delta < 0 else "ficou estavel"
        return f"O peso {direction} {abs(delta):.1f} kg em relacao a pesagem anterior."
