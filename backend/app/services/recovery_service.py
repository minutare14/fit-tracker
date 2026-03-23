from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import IntegrationConnection, IntegrationProvider
from app.models.performance import DerivedMetric
from app.models.wellness import HealthMetric
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.recovery import (
    RecoveryMetricWidgetRead,
    RecoveryOverviewRead,
    RecoverySyncStatusRead,
    RecoveryTrendPointRead,
)


class RecoveryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_overview(self, user_id: str) -> RecoveryOverviewRead:
        await self.integration_repository.ensure_user(user_id)
        start = datetime.now(timezone.utc) - timedelta(days=13)

        metrics = list(
            (
                await self.session.execute(
                    select(HealthMetric)
                    .where(HealthMetric.user_id == user_id, HealthMetric.date >= start)
                    .order_by(HealthMetric.date.asc())
                )
            )
            .scalars()
            .all()
        )
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

        readiness_row = next((item for item in reversed(derived) if item.readiness_score is not None), None)
        readiness_missing_inputs: list[str] = []
        if "HRV" not in latest_by_type:
            readiness_missing_inputs.append("HRV")
        if "Sleep" not in latest_by_type:
            readiness_missing_inputs.append("Sono")

        recommendations: list[str] = []
        if "HRV" not in latest_by_type:
            recommendations.append("Sem HRV recente. O widget segue funcional, mas a readiness fica indisponivel.")
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
                    status="available" if readiness_row and not readiness_missing_inputs else "missing",
                    value=float(readiness_row.readiness_score) if readiness_row and not readiness_missing_inputs else None,
                    unit="%",
                    helper=(
                        "Readiness calculada com HRV e sono recentes."
                        if readiness_row and not readiness_missing_inputs
                        else f"Readiness indisponivel: faltam {', '.join(readiness_missing_inputs)}."
                    ),
                    observed_at=readiness_row.date if readiness_row and not readiness_missing_inputs else None,
                    source="DERIVED" if readiness_row and not readiness_missing_inputs else None,
                    reason_unavailable=(
                        None if readiness_row and not readiness_missing_inputs else "Dados insuficientes para calcular readiness."
                    ),
                    missing_inputs=readiness_missing_inputs,
                ),
                "hrv": self._metric_widget(latest_by_type.get("HRV"), "HRV", "ms", "HRV indisponivel no momento."),
                "restingHr": self._metric_widget(latest_by_type.get("RHR"), "RHR", "bpm", "RHR indisponivel no momento."),
                "sleep": self._metric_widget(
                    latest_by_type.get("Sleep"),
                    "Sono",
                    "h",
                    "Sono indisponivel no momento.",
                    transform=lambda value: round(value / 3600.0, 1),
                ),
                "temperature": self._metric_widget(latest_by_type.get("BodyTemp"), "Temperatura", "C", "Temperatura indisponivel no momento."),
            },
            trend=trend,
            recommendations=recommendations,
            has_minimum_data=bool(metrics or derived),
        )

    def _metric_widget(
        self,
        metric: HealthMetric | None,
        label: str,
        fallback_unit: str,
        missing_message: str,
        transform=None,
    ) -> RecoveryMetricWidgetRead:
        if metric is None:
            return RecoveryMetricWidgetRead(
                label=label,
                status="missing",
                value=None,
                unit=fallback_unit,
                helper=missing_message,
                reason_unavailable=missing_message,
            )

        value = transform(metric.value) if transform else metric.value
        return RecoveryMetricWidgetRead(
            label=label,
            status="available",
            value=value,
            unit=fallback_unit if transform else (metric.unit if metric.unit else fallback_unit),
            helper=f"{label} mais recente recebida pelo backend Python.",
            observed_at=metric.date,
            source=metric.source.value if hasattr(metric.source, "value") else str(metric.source),
        )
