from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import IntegrationConnection, IntegrationProvider
from app.models.performance import BjjSession, DerivedMetric, WeightEntry
from app.models.hevy import HevyWorkout
from app.models.wellness import HealthMetric
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.dashboard import (
    DashboardMetricRead,
    DashboardOverviewRead,
    DashboardRecentSessionRead,
    DashboardSourceRead,
    DashboardTrendPointRead,
)


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_overview(self, user_id: str) -> DashboardOverviewRead:
        await self.integration_repository.ensure_user(user_id)
        now = datetime.now(timezone.utc)
        last_7_days = now - timedelta(days=6)
        last_30_days = now - timedelta(days=30)

        hevy_connection = await self._get_connection(user_id, IntegrationProvider.HEVY)
        health_connection = await self._get_connection(user_id, IntegrationProvider.HEALTH_AUTO_EXPORT)

        bjj_sessions = list(
            (
                await self.session.execute(
                    select(BjjSession)
                    .where(BjjSession.user_id == user_id, BjjSession.date >= last_30_days)
                    .order_by(BjjSession.date.desc())
                )
            )
            .scalars()
            .all()
        )
        strength_workouts = list(
            (
                await self.session.execute(
                    select(HevyWorkout)
                    .where(HevyWorkout.user_id == user_id, HevyWorkout.started_at >= last_30_days)
                    .order_by(HevyWorkout.started_at.desc())
                )
            )
            .scalars()
            .all()
        )
        recent_sleep = list(
            (
                await self.session.execute(
                    select(HealthMetric)
                    .where(
                        HealthMetric.user_id == user_id,
                        HealthMetric.type == "Sleep",
                        HealthMetric.date >= last_7_days,
                    )
                    .order_by(HealthMetric.date.desc())
                )
            )
            .scalars()
            .all()
        )
        recent_derived = list(
            (
                await self.session.execute(
                    select(DerivedMetric)
                    .where(DerivedMetric.user_id == user_id, DerivedMetric.date >= last_7_days)
                    .order_by(DerivedMetric.date.asc())
                )
            )
            .scalars()
            .all()
        )
        weight_entries = list(
            (
                await self.session.execute(
                    select(WeightEntry)
                    .where(WeightEntry.user_id == user_id)
                    .order_by(WeightEntry.date.desc())
                    .limit(2)
                )
            )
            .scalars()
            .all()
        )

        weekly_bjj_load = sum(session.session_load for session in bjj_sessions if session.date >= last_7_days)
        weekly_strength_minutes = sum(
            int((workout.duration_seconds or 0) / 60) for workout in strength_workouts if workout.started_at >= last_7_days
        )
        average_sleep = (
            round(sum(metric.value for metric in recent_sleep) / len(recent_sleep) / 3600.0, 1)
            if recent_sleep
            else None
        )
        readiness = recent_derived[-1].readiness_score if recent_derived else None
        current_weight = weight_entries[0].weight_kg if weight_entries else None
        previous_weight = weight_entries[1].weight_kg if len(weight_entries) > 1 else current_weight

        trend: list[DashboardTrendPointRead] = []
        for day_offset in range(7):
            current_day = (last_7_days + timedelta(days=day_offset)).date()
            trend.append(
                DashboardTrendPointRead(
                    date=current_day.isoformat(),
                    bjj_load=sum(item.session_load for item in bjj_sessions if item.date.date() == current_day),
                    strength_minutes=sum(
                        int((item.duration_seconds or 0) / 60)
                        for item in strength_workouts
                        if item.started_at.date() == current_day
                    ),
                    sleep_hours=next(
                        (round(metric.value / 3600.0, 1) for metric in recent_sleep if metric.date.date() == current_day),
                        None,
                    ),
                    readiness=next(
                        (item.readiness_score for item in recent_derived if item.date.date() == current_day),
                        None,
                    ),
                )
            )

        recent_sessions = [
            DashboardRecentSessionRead(
                id=row.id,
                date=row.date.date().isoformat(),
                title=row.training_type,
                subtitle=f"{row.duration_minutes} min · sRPE {row.srpe}",
                load=row.session_load,
            )
            for row in bjj_sessions[:5]
        ]

        recommendations: list[str] = []
        if not hevy_connection or hevy_connection.status != "CONNECTED":
            recommendations.append("Conecte o Hevy para consolidar a carga de forca no dashboard.")
        if not health_connection or not health_connection.last_synced_at:
            recommendations.append("Configure o Auto Export para liberar readiness e sono reais.")
        if not bjj_sessions:
            recommendations.append("Registre a primeira sessao de BJJ para iniciar historico operacional.")
        if not recommendations:
            recommendations.append("As fontes principais estao conectadas e a visao consolidada esta operacional.")

        return DashboardOverviewRead(
            sources=[
                DashboardSourceRead(
                    label="Hevy conectado" if hevy_connection and hevy_connection.status == "CONNECTED" else "Hevy desconectado",
                    state="connected" if hevy_connection and hevy_connection.status == "CONNECTED" else "missing",
                    detail=hevy_connection.last_synced_at.isoformat() if hevy_connection and hevy_connection.last_synced_at else "Sem sincronizacao concluida",
                ),
                DashboardSourceRead(
                    label="Health Auto Export ativo" if health_connection and health_connection.last_synced_at else "Health Auto Export ausente",
                    state="connected" if health_connection and health_connection.last_synced_at else "warning",
                    detail=health_connection.last_synced_at.isoformat() if health_connection and health_connection.last_synced_at else "Sem payload recebido",
                ),
            ],
            metrics=[
                DashboardMetricRead(
                    label="Readiness",
                    value=f"{readiness}%" if readiness is not None else "--",
                    helper="Ultima derivada persistida." if readiness is not None else "Aguardando base suficiente.",
                ),
                DashboardMetricRead(
                    label="Carga semanal",
                    value=str(weekly_bjj_load),
                    helper=f"{weekly_strength_minutes} min de forca sincronizados nos ultimos 7 dias.",
                ),
                DashboardMetricRead(
                    label="Peso atual",
                    value=f"{current_weight:.1f} kg" if current_weight is not None else "--",
                    helper=(
                        f"{current_weight - previous_weight:+.1f} kg vs ultimo registro"
                        if current_weight is not None and previous_weight is not None
                        else "Sem historico suficiente."
                    ),
                ),
                DashboardMetricRead(
                    label="Sono medio",
                    value=f"{average_sleep:.1f} h" if average_sleep is not None else "--",
                    helper="Media dos ultimos 7 dias." if average_sleep is not None else "Sem leituras recentes de sono.",
                ),
            ],
            trend=trend,
            recent_sessions=recent_sessions,
            recommendations=recommendations,
            has_any_data=bool(bjj_sessions or strength_workouts or recent_sleep or weight_entries),
        )

    async def _get_connection(self, user_id: str, provider: IntegrationProvider) -> IntegrationConnection | None:
        query = select(IntegrationConnection).where(
            IntegrationConnection.user_id == user_id,
            IntegrationConnection.provider == provider,
        )
        return (await self.session.execute(query)).scalar_one_or_none()
