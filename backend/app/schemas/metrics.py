from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DailyRollupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    date: datetime
    bjj_load: int
    strength_volume_kg: float
    recovery_score: int
    sleep_hours: float | None = None
    weight_kg: float | None = None
    readiness_label: str | None = None
