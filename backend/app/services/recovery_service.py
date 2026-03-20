from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import IntegrationConnection, IntegrationProvider
from app.models.performance import DerivedMetric
from app.models.wellness import HealthMetric
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.recovery import RecoveryMetricWidgetRead, RecoveryOverviewRead, RecoverySyncStatusRead, RecoveryTrendPointRead


class RecoveryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_overview(self, user_id: str) -> RecoveryOverviewRead:
        await self.integration_repository.ensure_user(user_id)
        start = datetime.now(timezone.utc) - timedelta(days=13)

        query = (
            select(HealthMetric)
            .where(HealthMetric.user_id == user_id, HealthMetric.date >= start)
            .order_by(HealthMetric.date.asc())
        )
        metrics = list((await self.session.execute(query)).scalars().all())
        derived = list(
            (
                await self.session.execute(
                    select(DerivedMetric)
                    .where(DerivedMetric.user_id == user_id, DerivedMetric.date >= start)
                    .order_by(DerivedMetric.date.asc())
                )
            )
            .scalars()
            .all()
        )
        connection = (
            await self.session.execute(
                select(IntegrationConnection).where(
                    IntegrationConnection.user_id == user_id,
                    IntegrationConnection.provider == IntegrationProvider.HEALTH_AUTO_EXPORT,
                )
            )
        ).scalar_one_or_none()

        latest_by_type: dict[str, HealthMetric] = {}
        for metric in metrics:
            latest_by_type[metric.type] = metric

        trend = []
        for day_offset in range(14):
            current_day = (start + timedelta(days=day_offset)).date()
            trend.append(
                RecoveryTrendPointRead(
                    date=current_day.isoformat(),
                    hrv=next((item.value for item in metrics if item.type == "HRV" and item.date.date() == current_day), None),
                    sleep_hours=next(
                        (round(item.value / 3600.0, 1) for item in metrics if item.type == "Sleep" and item.date.date() == current_day),
                        None,
                    ),
                    load=next((item.daily_load for item in derived if item.date.date() == current_day), None),
                    recovery=next((item.readiness_score for item in derived if item.date.date() == current_day), None),
                )
            )

        readiness = derived[-1].readiness_score if derived else None
        recommendations: list[str] = []
        if "HRV" not in latest_by_type:
            recommendations.append("Sem HRV recente. O widget segue funcional, mas a readiness fica parcial.")
        if "Sleep" not in latest_by_type:
            recommendations.append("Sem dados de sono. Envie payloads do Auto Export para completar a leitura.")
        if not connection or not connection.last_synced_at:
            recommendations.append("Nenhum payload do webhook chegou ainda. Revise URL e segredo.")
        if not recommendations:
            recommendations.append("Os principais sinais de recuperacao estao chegando normalmente.")

        return RecoveryOverviewRead(
            sync_status=RecoverySyncStatusRead(
                connected=bool(connection and connection.last_synced_at),
                last_sync=connection.last_synced_at.isoformat() if connection and connection.last_synced_at else None,
                total_records=len(metrics),
                status=connection.status if connection else "DISCONNECTED",
            ),
            metrics={
                "readiness": RecoveryMetricWidgetRead(
                    label="Readiness",
                    value=float(readiness) if readiness is not None else None,
                    unit="%",
                    helper="Ultima derivada persistida." if readiness is not None else "Sem derivadas suficientes.",
                ),
                "hrv": RecoveryMetricWidgetRead(
                    label="HRV",
                    value=latest_by_type["HRV"].value if "HRV" in latest_by_type else None,
                    unit=latest_by_type["HRV"].unit if "HRV" in latest_by_type else "ms",
                    helper="Variabilidade cardiaca mais recente.",
                ),
                "restingHr": RecoveryMetricWidgetRead(
                    label="RHR",
                    value=latest_by_type["RHR"].value if "RHR" in latest_by_type else None,
                    unit=latest_by_type["RHR"].unit if "RHR" in latest_by_type else "bpm",
                    helper="Frequencia cardiaca de repouso.",
                ),
                "sleep": RecoveryMetricWidgetRead(
                    label="Sono",
                    value=round(latest_by_type["Sleep"].value / 3600.0, 1) if "Sleep" in latest_by_type else None,
                    unit="h",
                    helper="Horas de sono na ultima leitura.",
                ),
                "temperature": RecoveryMetricWidgetRead(
                    label="Temperatura",
                    value=latest_by_type["BodyTemp"].value if "BodyTemp" in latest_by_type else None,
                    unit=latest_by_type["BodyTemp"].unit if "BodyTemp" in latest_by_type else "C",
                    helper="Temperatura corporal mais recente.",
                ),
            },
            trend=trend,
            recommendations=recommendations,
            has_minimum_data=bool(metrics or derived),
        )
