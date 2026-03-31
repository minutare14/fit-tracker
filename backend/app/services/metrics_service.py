from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.metrics.derivations.daily_metrics import (
    calculate_acute_load,
    calculate_acwr,
    calculate_chronic_load,
    calculate_recovery_score,
    readiness_label,
)
from app.models.daily_rollup import DailyRollup
from app.models.performance import BjjSession, DerivedMetric, ReadinessSnapshot
from app.models.wellness import HealthMetric
from app.models.wellness import NutritionDaily
from app.repositories.hevy_repository import HevyRepository
from app.repositories.wellness_repository import WellnessRepository


def normalize_day(value: datetime) -> datetime:
    return datetime.combine(value.date(), time(hour=12), tzinfo=timezone.utc)


class MetricsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.wellness_repository = WellnessRepository(session)
        self.hevy_repository = HevyRepository(session)

    async def refresh_daily_rollup(self, user_id: str, date: datetime):
        normalized_day = normalize_day(date)
        metrics = await self.wellness_repository.list_health_metrics_for_day(user_id, normalized_day)
        workouts = await self.hevy_repository.list_workouts(user_id, limit=100)
        workouts_of_day = [workout for workout in workouts if workout.started_at.date() == normalized_day.date()]

        session_query = select(BjjSession).where(
            BjjSession.user_id == user_id,
            BjjSession.date >= datetime.combine(normalized_day.date(), time.min, tzinfo=timezone.utc),
            BjjSession.date < datetime.combine(normalized_day.date() + timedelta(days=1), time.min, tzinfo=timezone.utc),
        )
        bjj_sessions = list((await self.session.execute(session_query)).scalars().all())

        hrv = next((metric.value for metric in metrics if metric.type == "HRV"), None)
        sleep_seconds = next((metric.value for metric in metrics if metric.type == "Sleep"), None)
        resting_hr = next((metric.value for metric in metrics if metric.type == "RHR"), None)
        weight_kg = next((metric.value for metric in metrics if metric.type == "Weight"), None)

        strength_volume_kg = 0.0
        for workout in workouts_of_day:
            for exercise in workout.exercises:
                for workout_set in exercise.sets:
                    strength_volume_kg += float(workout_set.weight_kg or 0) * float(workout_set.reps or 0)

        bjj_load = sum(session.session_load for session in bjj_sessions)
        recovery_score = calculate_recovery_score(hrv, sleep_seconds)

        nutrition_query = select(NutritionDaily).where(
            NutritionDaily.user_id == user_id,
            NutritionDaily.date >= datetime.combine(normalized_day.date(), time.min, tzinfo=timezone.utc),
            NutritionDaily.date < datetime.combine(normalized_day.date() + timedelta(days=1), time.min, tzinfo=timezone.utc),
        )
        nutrition = (await self.session.execute(nutrition_query)).scalar_one_or_none()

        daily_rollup = await self.wellness_repository.upsert_daily_rollup(
            user_id,
            normalized_day,
            {
                "bjj_load": bjj_load,
                "strength_volume_kg": strength_volume_kg,
                "recovery_score": recovery_score or 0,
                "sleep_hours": (sleep_seconds / 3600.0) if sleep_seconds else None,
                "weight_kg": weight_kg,
                "readiness_label": readiness_label(recovery_score),
                "bjj_sessions_count": len(bjj_sessions),
                "total_bjj_minutes": sum(s.duration_minutes for s in bjj_sessions),
                "total_session_load": bjj_load,
                "calories": nutrition.calories if nutrition else None,
                "protein_g": nutrition.protein if nutrition else None,
                "carbs_g": nutrition.carbs if nutrition else None,
                "fat_g": nutrition.fat if nutrition else None,
                "hydration_ml": (nutrition.water_liters * 1000) if nutrition and nutrition.water_liters else None,
            },
        )

        await self.refresh_derived_metrics(user_id, normalized_day, recovery_score, hrv, resting_hr, sleep_seconds)
        return daily_rollup

    async def refresh_derived_metrics(
        self,
        user_id: str,
        date: datetime,
        recovery_score: int | None = None,
        hrv: float | None = None,
        resting_hr: float | None = None,
        sleep_seconds: float | None = None,
    ) -> DerivedMetric:
        normalized_day = normalize_day(date)
        since = normalized_day - timedelta(days=27)

        session_query = (
            select(BjjSession)
            .where(and_(BjjSession.user_id == user_id, BjjSession.date >= since, BjjSession.date <= normalized_day))
            .order_by(BjjSession.date.asc())
        )
        sessions = list((await self.session.execute(session_query)).scalars().all())
        by_day: dict[datetime.date, int] = {}
        for session in sessions:
            by_day[session.date.date()] = by_day.get(session.date.date(), 0) + session.session_load

        loads = [by_day.get((since + timedelta(days=index)).date(), 0) for index in range(28)]
        daily_load = by_day.get(normalized_day.date(), 0)
        acute_load = calculate_acute_load(loads)
        chronic_load = calculate_chronic_load(loads)
        acwr = calculate_acwr(acute_load, chronic_load)

        derived_query = select(DerivedMetric).where(
            DerivedMetric.user_id == user_id,
            DerivedMetric.date == normalized_day,
        )
        derived_metric = (await self.session.execute(derived_query)).scalar_one_or_none()
        if not derived_metric:
            derived_metric = DerivedMetric(user_id=user_id, date=normalized_day)
            self.session.add(derived_metric)

        derived_metric.daily_load = daily_load
        derived_metric.acute_load = acute_load
        derived_metric.chronic_load = chronic_load
        derived_metric.acwr = acwr
        derived_metric.readiness_score = recovery_score

        snapshot_query = select(ReadinessSnapshot).where(
            ReadinessSnapshot.user_id == user_id,
            ReadinessSnapshot.date == normalized_day,
        )
        snapshot = (await self.session.execute(snapshot_query)).scalar_one_or_none()
        if recovery_score is None:
            if snapshot:
                await self.session.delete(snapshot)
            await self.session.flush()
            return derived_metric

        if not snapshot:
            snapshot = ReadinessSnapshot(
                user_id=user_id,
                date=normalized_day,
                readiness_score=recovery_score,
                hrv_value=hrv,
                resting_hr_value=resting_hr,
                sleep_hours=(sleep_seconds / 3600.0) if sleep_seconds else None,
                explanation=readiness_label(recovery_score),
            )
            self.session.add(snapshot)
        else:
            snapshot.readiness_score = recovery_score
            snapshot.hrv_value = hrv
            snapshot.resting_hr_value = resting_hr
            snapshot.sleep_hours = (sleep_seconds / 3600.0) if sleep_seconds else None
            snapshot.explanation = readiness_label(recovery_score)

        await self.session.flush()
        return derived_metric

    async def get_daily_rollups(self, user_id: str, days: int):
        return await self.wellness_repository.list_daily_rollups(user_id, days)

    async def get_latest_derived_metric(self, user_id: str) -> DerivedMetric | None:
        query = (
            select(DerivedMetric)
            .where(DerivedMetric.user_id == user_id)
            .order_by(DerivedMetric.date.desc())
            .limit(1)
        )
        return (await self.session.execute(query)).scalar_one_or_none()

    async def list_recent_health_metrics(self, user_id: str, days: int) -> list[HealthMetric]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query = (
            select(HealthMetric)
            .where(HealthMetric.user_id == user_id, HealthMetric.date >= since)
            .order_by(HealthMetric.date.asc())
        )
        return list((await self.session.execute(query)).scalars().all())

    async def list_recent_rollups(self, user_id: str, days: int) -> list[DailyRollup]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query = (
            select(DailyRollup)
            .where(DailyRollup.user_id == user_id, DailyRollup.date >= since)
            .order_by(DailyRollup.date.asc())
        )
        return list((await self.session.execute(query)).scalars().all())
