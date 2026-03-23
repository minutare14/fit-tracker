from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wellness import NutritionDaily
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.nutrition import (
    NutritionAvailabilityRead,
    NutritionLogRead,
    NutritionOverviewRead,
    NutritionStatsRead,
    NutritionTargetsRead,
)
from app.services.profile_service import ProfileService


class NutritionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)
        self.profile_service = ProfileService(session)

    async def get_overview(self, user_id: str) -> NutritionOverviewRead:
        user = await self.integration_repository.ensure_user(user_id)
        profile = await self.profile_service.get_profile(user_id)

        history_query = (
            select(NutritionDaily)
            .where(NutritionDaily.user_id == user_id)
            .order_by(NutritionDaily.date.desc())
            .limit(30)
        )
        entries = list((await self.session.execute(history_query)).scalars().all())

        total_tracked_days = int(
            await self.session.scalar(
                select(func.count()).select_from(NutritionDaily).where(NutritionDaily.user_id == user_id)
            )
            or 0
        )

        recent_entries = entries[:7]
        targets = NutritionTargetsRead(
            calories=user.calories_target,
            protein=user.protein_target,
            carbs=user.carbs_target,
            fat=user.fat_target,
            hydration=profile.hydration_target_liters,
            hydration_liters=profile.hydration_target_liters,
        )
        adherence_values = [self._is_adherent(entry, targets) for entry in recent_entries]
        valid_adherence = [value for value in adherence_values if value is not None]
        macros_hit_7d = sum(1 for value in valid_adherence if value)
        logs = [self._serialize_log(entry, targets) for entry in entries]
        stats = NutritionStatsRead(
            avg_calories_7d=self._average(recent_entries, "calories"),
            avg_protein_7d=self._average(recent_entries, "protein"),
            avg_carbs_7d=self._average(recent_entries, "carbs"),
            avg_fat_7d=self._average(recent_entries, "fat"),
            avg_hydration_7d=self._average(recent_entries, "water_liters"),
            adherence_rate_7d=int((macros_hit_7d / len(valid_adherence)) * 100) if valid_adherence else 0,
            macros_hit_7d=macros_hit_7d,
            total_tracked_days=total_tracked_days,
        )

        return NutritionOverviewRead(
            availability=NutritionAvailabilityRead(
                has_data=bool(entries),
                source=self._resolve_source(entries),
                days_tracked=total_tracked_days,
                last_entry_at=entries[0].date if entries else None,
            ),
            recent_logs=logs[:14],
            history=logs,
            stats=stats,
            summary=stats,
            targets=targets,
            empty_state_reason=None if entries else "Nenhum dado nutricional foi consolidado ainda.",
        )

    def _serialize_log(self, entry: NutritionDaily, targets: NutritionTargetsRead) -> NutritionLogRead:
        adherence = self._is_adherent(entry, targets)
        source = entry.source.value if hasattr(entry.source, "value") else str(entry.source)
        return NutritionLogRead(
            date=entry.date.date(),
            calories=entry.calories,
            protein=entry.protein,
            carbs=entry.carbs,
            fat=entry.fat,
            water_liters=entry.water_liters,
            is_adherent=adherence,
            source=source,
            notes=entry.notes,
            hydration=entry.water_liters,
            adherence=adherence,
        )

    def _average(self, entries: list[NutritionDaily], field: str) -> float | None:
        values = [float(getattr(entry, field)) for entry in entries if getattr(entry, field) is not None]
        if not values:
            return None
        return round(sum(values) / len(values), 1)

    def _resolve_source(self, entries: list[NutritionDaily]) -> str:
        if not entries:
            return "NONE"
        sources = {
            entry.source.value if hasattr(entry.source, "value") else str(entry.source)
            for entry in entries
        }
        if len(sources) == 1:
            return next(iter(sources))
        return "MIXED"

    def _is_adherent(self, entry: NutritionDaily, targets: NutritionTargetsRead) -> bool | None:
        checks = [
            self._within(entry.calories, targets.calories, 0.1),
            self._within(entry.protein, targets.protein, 0.15),
            self._within(entry.carbs, targets.carbs, 0.15),
            self._within(entry.fat, targets.fat, 0.15),
            self._within(entry.water_liters, targets.hydration, 0.15),
        ]
        relevant_checks = [check for check in checks if check is not None]
        if not relevant_checks:
            return entry.adherent if entry.adherent else None
        return all(relevant_checks)

    def _within(self, value: float | int | None, target: float | None, tolerance: float) -> bool | None:
        if value is None or target is None or target <= 0:
            return None
        minimum = target * (1 - tolerance)
        maximum = target * (1 + tolerance)
        return minimum <= float(value) <= maximum
