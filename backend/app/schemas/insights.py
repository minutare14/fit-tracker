from app.schemas.common import APIModel


class InsightsOverviewRead(APIModel):
    readiness: int | None = None
    weekly_load: int
    bjj_sessions_last_30_days: int
    strength_sessions_last_30_days: int
    health_records_last_14_days: int
    nutrition_logs_last_14_days: int
    data_gaps: list[str]
    recommendations: list[str]
    has_enough_data: bool
