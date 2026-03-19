from app.schemas.common import APIModel


class DashboardSourceRead(APIModel):
    label: str
    state: str
    detail: str


class DashboardMetricRead(APIModel):
    label: str
    value: str
    helper: str


class DashboardTrendPointRead(APIModel):
    date: str
    bjj_load: int
    strength_minutes: int
    sleep_hours: float | None = None
    readiness: int | None = None


class DashboardRecentSessionRead(APIModel):
    id: str
    date: str
    title: str
    subtitle: str
    load: int


class DashboardOverviewRead(APIModel):
    sources: list[DashboardSourceRead]
    metrics: list[DashboardMetricRead]
    trend: list[DashboardTrendPointRead]
    recent_sessions: list[DashboardRecentSessionRead]
    recommendations: list[str]
    has_any_data: bool
