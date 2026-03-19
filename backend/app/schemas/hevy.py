from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import APIModel


class HevyConnectionCreate(APIModel):
    user_id: str = Field(default="default-user")
    api_key: str
    external_user_id: str | None = None


class HevySyncRequest(APIModel):
    user_id: str = Field(default="default-user")
    mode: Literal["delta", "full"] = "delta"


class HevySyncResult(APIModel):
    success: bool
    sync_type: str
    processed: int
    created: int
    updated: int
    metadata: dict | None = None


class HevyStatusRead(APIModel):
    user_id: str
    connected: bool
    status: str
    last_synced_at: datetime | None = None
    last_error: str | None = None
    workout_count: int = 0
    exercise_template_count: int = 0


class HevyExerciseTemplateRead(APIModel):
    id: str
    external_template_id: str
    title: str
    category: str | None = None
    primary_muscle: str | None = None
    equipment: str | None = None
    is_custom: bool


class HevyWorkoutSetRead(APIModel):
    id: str
    order_index: int
    set_type: str
    reps: int | None = None
    weight_kg: float | None = None


class HevyWorkoutExerciseRead(APIModel):
    id: str
    exercise_name: str
    order_index: int
    sets: list[HevyWorkoutSetRead]


class HevyWorkoutRead(APIModel):
    id: str
    external_workout_id: str
    title: str | None = None
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    exercises: list[HevyWorkoutExerciseRead]
