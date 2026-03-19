from datetime import datetime

from app.schemas.common import APIModel


class DailyRollupRead(APIModel):
    id: str
    user_id: str
    date: datetime
    bjj_load: int
    strength_volume_kg: float
    recovery_score: int
    sleep_hours: float | None = None
    weight_kg: float | None = None
    readiness_label: str | None = None
