from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.metrics.derivations.daily_metrics import calculate_recovery_score, readiness_label
from app.repositories.hevy_repository import HevyRepository
from app.repositories.wellness_repository import WellnessRepository


class MetricsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.wellness_repository = WellnessRepository(session)
        self.hevy_repository = HevyRepository(session)

    async def refresh_daily_rollup(self, user_id: str, date: datetime):
        normalized_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        metrics = await self.wellness_repository.list_health_metrics_for_day(user_id, normalized_day)
        workouts = await self.hevy_repository.list_workouts(user_id, limit=100)
        workouts_of_day = [workout for workout in workouts if workout.started_at.date() == normalized_day.date()]

        hrv = next((metric.value for metric in metrics if metric.type == "HRV"), None)
        sleep_seconds = next((metric.value for metric in metrics if metric.type == "Sleep"), None)
        weight_kg = next((metric.value for metric in metrics if metric.type == "Weight"), None)

        strength_volume_kg = 0.0
        for workout in workouts_of_day:
            for exercise in workout.exercises:
                for workout_set in exercise.sets:
                    strength_volume_kg += float(workout_set.weight_kg or 0) * float(workout_set.reps or 0)

        recovery_score = calculate_recovery_score(hrv, sleep_seconds)

        return await self.wellness_repository.upsert_daily_rollup(
            user_id,
            normalized_day,
            {
                "bjj_load": 0,
                "strength_volume_kg": strength_volume_kg,
                "recovery_score": recovery_score,
                "sleep_hours": (sleep_seconds / 3600.0) if sleep_seconds else None,
                "weight_kg": weight_kg,
                "readiness_label": readiness_label(recovery_score),
            },
        )

    async def get_daily_rollups(self, user_id: str, days: int):
        return await self.wellness_repository.list_daily_rollups(user_id, days)
