from datetime import date

from pydantic import Field

from app.schemas.common import APIModel


class ProfileRead(APIModel):
    user_id: str
    name: str = ""
    email: str = ""
    display_name: str = ""
    birth_date: date | None = None
    sex: str = ""
    height_cm: float | None = None
    current_weight_kg: float | None = None
    target_weight_kg: float | None = None
    target_category: str = ""
    belt_rank: str = ""
    academy_team: str = ""
    primary_goal: str = ""
    injuries_restrictions: str = ""
    timezone: str = "America/Bahia"
    unit_system: str = "metric"
    weight_unit: str = "kg"
    daily_calorie_target: float | None = None
    calorie_target: float | None = None
    protein_target_g: float | None = None
    carbs_target_g: float | None = None
    fat_target_g: float | None = None
    hydration_target_liters: float | None = None
    hydration_target_ml: float | None = None


class ProfileUpdate(APIModel):
    user_id: str = Field(default="default-user")
    name: str = ""
    display_name: str = ""
    birth_date: date | None = None
    sex: str = ""
    height_cm: float | None = None
    current_weight_kg: float | None = None
    target_weight_kg: float | None = None
    target_category: str = ""
    belt_rank: str = ""
    academy_team: str = ""
    primary_goal: str = ""
    injuries_restrictions: str = ""
    timezone: str = "America/Bahia"
    unit_system: str = "metric"
    weight_unit: str = "kg"
    daily_calorie_target: float | None = None
    calorie_target: float | None = None
    protein_target_g: float | None = None
    carbs_target_g: float | None = None
    fat_target_g: float | None = None
    hydration_target_liters: float | None = None
    hydration_target_ml: float | None = None


class ProfileWriteResult(APIModel):
    success: bool
    profile: ProfileRead
