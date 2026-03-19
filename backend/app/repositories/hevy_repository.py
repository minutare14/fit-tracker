from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import selectinload

from app.models.hevy import HevyExerciseTemplate, HevyWorkout, HevyWorkoutExercise, HevyWorkoutSet
from app.repositories.base import BaseRepository


class HevyRepository(BaseRepository):
    async def count_exercise_templates(self) -> int:
        return int(await self.session.scalar(select(func.count()).select_from(HevyExerciseTemplate)) or 0)

    async def count_workouts(self, user_id: str) -> int:
        return int(
            await self.session.scalar(
                select(func.count()).select_from(HevyWorkout).where(HevyWorkout.user_id == user_id)
            )
            or 0
        )

    async def list_exercise_templates(self, search: str | None = None) -> list[HevyExerciseTemplate]:
        query = select(HevyExerciseTemplate).order_by(HevyExerciseTemplate.title.asc())
        if search:
            query = query.where(HevyExerciseTemplate.title.ilike(f"%{search}%"))
        return list((await self.session.execute(query)).scalars().all())

    async def upsert_exercise_template(self, payload: dict) -> tuple[HevyExerciseTemplate, bool]:
        existing = await self.session.scalar(
            select(HevyExerciseTemplate).where(HevyExerciseTemplate.external_template_id == payload["id"])
        )

        stmt = insert(HevyExerciseTemplate).values(
            external_template_id=payload["id"],
            title=payload["title"],
            category=payload.get("exercise_type") or payload.get("type"),
            primary_muscle=payload.get("primary_muscle_group"),
            secondary_muscles=payload.get("secondary_muscle_groups") or payload.get("other_muscles"),
            equipment=payload.get("equipment") or payload.get("equipment_category"),
            is_custom=payload.get("is_custom", False),
            raw_payload_json=payload,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["external_template_id"],
            set_={
                "title": stmt.excluded.title,
                "category": stmt.excluded.category,
                "primary_muscle": stmt.excluded.primary_muscle,
                "secondary_muscles": stmt.excluded.secondary_muscles,
                "equipment": stmt.excluded.equipment,
                "is_custom": stmt.excluded.is_custom,
                "raw_payload_json": stmt.excluded.raw_payload_json,
                "updated_at": func.now(),
            },
        ).returning(HevyExerciseTemplate)
        record = (await self.session.execute(stmt)).scalar_one()
        return record, existing is None

    async def list_workouts(self, user_id: str, limit: int) -> list[HevyWorkout]:
        query = (
            select(HevyWorkout)
            .where(HevyWorkout.user_id == user_id)
            .options(selectinload(HevyWorkout.exercises).selectinload(HevyWorkoutExercise.sets))
            .order_by(HevyWorkout.started_at.desc())
            .limit(limit)
        )
        return list((await self.session.execute(query)).scalars().all())

    async def get_workout_by_external_id(self, external_workout_id: str) -> HevyWorkout | None:
        query = select(HevyWorkout).where(HevyWorkout.external_workout_id == external_workout_id)
        return (await self.session.execute(query)).scalar_one_or_none()

    async def upsert_workout(self, user_id: str, payload: dict) -> tuple[HevyWorkout, bool]:
        existing = await self.get_workout_by_external_id(payload["id"])
        created = existing is None

        if existing:
            await self.session.execute(delete(HevyWorkoutExercise).where(HevyWorkoutExercise.workout_id == existing.id))
            existing.title = payload.get("title")
            existing.started_at = datetime.fromisoformat(payload["start_time"].replace("Z", "+00:00"))
            existing.ended_at = (
                datetime.fromisoformat(payload["end_time"].replace("Z", "+00:00"))
                if payload.get("end_time")
                else None
            )
            existing.duration_seconds = payload.get("duration_seconds")
            existing.raw_payload_json = payload
            workout = existing
        else:
            workout = HevyWorkout(
                user_id=user_id,
                external_workout_id=payload["id"],
                title=payload.get("title"),
                started_at=datetime.fromisoformat(payload["start_time"].replace("Z", "+00:00")),
                ended_at=(
                    datetime.fromisoformat(payload["end_time"].replace("Z", "+00:00"))
                    if payload.get("end_time")
                    else None
                ),
                duration_seconds=payload.get("duration_seconds"),
                raw_payload_json=payload,
            )
            self.session.add(workout)
            await self.session.flush()

        for exercise_index, exercise_payload in enumerate(payload.get("exercises", [])):
            exercise = HevyWorkoutExercise(
                workout_id=workout.id,
                external_exercise_id=exercise_payload.get("id"),
                exercise_template_id=exercise_payload.get("exercise_template_id"),
                exercise_name=exercise_payload.get("title") or "Untitled exercise",
                order_index=exercise_index,
                raw_payload_json=exercise_payload,
            )
            self.session.add(exercise)
            await self.session.flush()

            for set_index, set_payload in enumerate(exercise_payload.get("sets", [])):
                workout_set = HevyWorkoutSet(
                    exercise_id=exercise.id,
                    external_set_id=set_payload.get("id"),
                    order_index=set_index,
                    set_type=set_payload.get("type") or "normal",
                    reps=set_payload.get("reps"),
                    weight_kg=set_payload.get("weight_kg"),
                    duration_seconds=set_payload.get("duration_seconds"),
                    distance_m=set_payload.get("distance_meters"),
                    is_warmup=(set_payload.get("type") == "warmup"),
                    raw_payload_json=set_payload,
                )
                self.session.add(workout_set)

        await self.session.flush()
        return workout, created
