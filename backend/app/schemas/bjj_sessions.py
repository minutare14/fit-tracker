from datetime import date as date_value, datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import APIModel


TrainingType = Literal["technical", "drill", "sparring", "competition", "open_mat"]
GiMode = Literal["gi", "nogi"]


class BjjSessionBase(APIModel):
    date: date_value
    start_time: str | None = None
    duration_minutes: int = Field(..., gt=0)
    location: str | None = None
    coach: str | None = None
    training_type: TrainingType
    gi_mode: GiMode = "gi"
    srpe: int = Field(..., ge=1, le=10)
    rounds: int | None = None
    round_duration_minutes: int | None = None
    round_rest_minutes: int | None = Field(default=None, ge=0)
    sparring_minutes: int | None = None
    drill_minutes: int | None = None
    technique_minutes: int | None = None
    trained_positions: list[str] = Field(default_factory=list)
    trained_techniques: list[str] = Field(default_factory=list)
    successful_techniques: list[str] = Field(default_factory=list)
    suffered_techniques: list[str] = Field(default_factory=list)
    notes: str | None = None
    fatigue_before: int | None = Field(default=None, ge=1, le=10)
    pain_level: int | None = Field(default=None, ge=1, le=10)
    injury_notes: str | None = None
    session_score: int | None = Field(default=None, ge=1, le=10)


class BjjSessionCreate(BjjSessionBase):
    user_id: str = Field(default="default-user")


class BjjSessionUpdate(APIModel):
    user_id: str = Field(default="default-user")
    date: date_value | None = None
    start_time: str | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    location: str | None = None
    coach: str | None = None
    training_type: TrainingType | None = None
    gi_mode: GiMode | None = None
    srpe: int | None = Field(default=None, ge=1, le=10)
    rounds: int | None = None
    round_duration_minutes: int | None = None
    round_rest_minutes: int | None = Field(default=None, ge=0)
    sparring_minutes: int | None = None
    drill_minutes: int | None = None
    technique_minutes: int | None = None
    trained_positions: list[str] | None = None
    trained_techniques: list[str] | None = None
    successful_techniques: list[str] | None = None
    suffered_techniques: list[str] | None = None
    notes: str | None = None
    fatigue_before: int | None = Field(default=None, ge=1, le=10)
    pain_level: int | None = Field(default=None, ge=1, le=10)
    injury_notes: str | None = None
    session_score: int | None = Field(default=None, ge=1, le=10)


class BjjSessionRead(BjjSessionBase):
    id: str
    session_load: int
    created_at: datetime
    updated_at: datetime


class BjjSessionsSummary(APIModel):
    total_sessions: int = 0
    monthly_mat_hours: float = 0
    weekly_load: int = 0
    average_srpe: float | None = None
    last_session_at: datetime | None = None


class BjjSessionsOverview(APIModel):
    items: list[BjjSessionRead]
    summary: BjjSessionsSummary


class BjjTechniqueBase(APIModel):
    name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=64)
    position: str | None = Field(default=None, max_length=64)
    gi_mode: GiMode | Literal["both"] = "both"


class BjjTechniqueCreate(BjjTechniqueBase):
    pass


class BjjTechniqueRead(BjjTechniqueBase):
    id: str
    active: bool
    created_at: datetime
