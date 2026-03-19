from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HevyConnectionCreate(BaseModel):
    user_id: str = Field(default="default-user")
    api_key: str
    external_user_id: str | None = None


class HevySyncRequest(BaseModel):
    user_id: str = Field(default="default-user")
    mode: Literal["delta", "full"] = "delta"


class HevySyncResult(BaseModel):
    success: bool
    sync_type: str
    processed: int
    created: int
    updated: int
    metadata: dict | None = None


class HevyStatusRead(BaseModel):
    user_id: str
    connected: bool
    status: str
    last_synced_at: datetime | None = None
    last_error: str | None = None
    workout_count: int = 0
    exercise_template_count: int = 0


class HevyExerciseTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    external_template_id: str
    title: str
    category: str | None = None
    primary_muscle: str | None = None
    equipment: str | None = None
    is_custom: bool


class HevyWorkoutSetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_index: int
    set_type: str
    reps: int | None = None
    weight_kg: float | None = None


class HevyWorkoutExerciseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    exercise_name: str
    order_index: int
    sets: list[HevyWorkoutSetRead]


class HevyWorkoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    external_workout_id: str
    title: str | None = None
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    exercises: list[HevyWorkoutExerciseRead]
