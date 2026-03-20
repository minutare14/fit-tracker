from datetime import date as date_value, datetime

from pydantic import Field

from app.schemas.common import APIModel


class WeightEntryCreate(APIModel):
    user_id: str = Field(default="default-user")
    date: date_value
    weight_kg: float = Field(..., gt=0)
    body_fat_pct: float | None = None
    notes: str | None = None
    source: str = "MANUAL"


class WeightEntryRead(APIModel):
    id: str
    date: date_value
    weight_kg: float
    body_fat_pct: float | None = None
    notes: str | None = None
    source: str
    created_at: datetime
    updated_at: datetime


class WeightStatsRead(APIModel):
    current_weight: float | None = None
    current_body_fat: float | None = None
    previous_weight: float | None = None
    previous_date: date_value | None = None
    avg_7d: float | None = None
    trend: str | None = None
    diff: float | None = None
    total_entries: int = 0


class WeightOverviewRead(APIModel):
    entries: list[WeightEntryRead]
    stats: WeightStatsRead
