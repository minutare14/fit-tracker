from datetime import date as date_value
from pydantic import Field
from app.schemas.common import APIModel


class NutritionStatsRead(APIModel):
    avg_calories_7d: float = 0
    adherence_rate_7d: int = 0
    macros_hit_7d: int = 0
    total_tracked_days: int = 0


class NutritionLogRead(APIModel):
    date: date_value
    calories: int = 0
    protein: int = 0
    carbs: int = 0
    fat: int = 0
    water_liters: float = 0
    is_adherent: bool = False


class NutritionOverviewRead(APIModel):
    recent_logs: list[NutritionLogRead]
    stats: NutritionStatsRead
