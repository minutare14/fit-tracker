from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import StringIdMixin, TimestampMixin


class HevyExerciseTemplate(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "hevy_exercise_templates"

    external_template_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    primary_muscle: Mapped[str | None] = mapped_column(String(128), nullable=True)
    secondary_muscles: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    equipment: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class HevyWorkout(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "hevy_workouts"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    external_workout_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="Hevy")
    raw_payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    exercises = relationship("HevyWorkoutExercise", back_populates="workout", cascade="all, delete-orphan")


class HevyWorkoutExercise(StringIdMixin, Base):
    __tablename__ = "hevy_workout_exercises"

    workout_id: Mapped[str] = mapped_column(ForeignKey("hevy_workouts.id", ondelete="CASCADE"), index=True)
    external_exercise_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    exercise_template_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    exercise_name: Mapped[str] = mapped_column(String(255))
    order_index: Mapped[int] = mapped_column(Integer)
    raw_payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    workout = relationship("HevyWorkout", back_populates="exercises")
    sets = relationship("HevyWorkoutSet", back_populates="exercise", cascade="all, delete-orphan")


class HevyWorkoutSet(StringIdMixin, Base):
    __tablename__ = "hevy_sets"

    exercise_id: Mapped[str] = mapped_column(ForeignKey("hevy_workout_exercises.id", ondelete="CASCADE"), index=True)
    external_set_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer)
    set_type: Mapped[str] = mapped_column(String(32), default="normal")
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    distance_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_warmup: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    exercise = relationship("HevyWorkoutExercise", back_populates="sets")
