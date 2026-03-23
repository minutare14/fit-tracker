from datetime import date as date_value, datetime

from pydantic import Field

from app.schemas.common import APIModel


class NutritionStatsRead(APIModel):
    avg_calories_7d: float | None = None
    avg_protein_7d: float | None = None
    avg_carbs_7d: float | None = None
    avg_fat_7d: float | None = None
    avg_hydration_7d: float | None = None
    adherence_rate_7d: int = 0
    macros_hit_7d: int = 0
    total_tracked_days: int = 0


class NutritionAvailabilityRead(APIModel):
    has_data: bool
    source: str
    days_tracked: int
    last_entry_at: datetime | None = None


class NutritionTargetsRead(APIModel):
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    hydration: float | None = None
    hydration_liters: float | None = None


class NutritionLogRead(APIModel):
    date: date_value
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    water_liters: float | None = None
    is_adherent: bool | None = None
    source: str = "NONE"
    notes: str | None = None
    hydration: float | None = None
    adherence: bool | None = None


class NutritionOverviewRead(APIModel):
    availability: NutritionAvailabilityRead
    recent_logs: list[NutritionLogRead] = Field(default_factory=list)
    history: list[NutritionLogRead] = Field(default_factory=list)
    stats: NutritionStatsRead
    summary: NutritionStatsRead
    targets: NutritionTargetsRead
    empty_state_reason: str | None = None
