from app.schemas.common import APIModel


class RecoveryMetricWidgetRead(APIModel):
    label: str
    value: float | None = None
    unit: str = ""
    helper: str


class RecoveryTrendPointRead(APIModel):
    date: str
    hrv: float | None = None
    sleep_hours: float | None = None
    load: int | None = None
    recovery: int | None = None


class RecoverySyncStatusRead(APIModel):
    connected: bool
    last_sync: str | None = None
    total_records: int
    status: str


class RecoveryOverviewRead(APIModel):
    sync_status: RecoverySyncStatusRead
    metrics: dict[str, RecoveryMetricWidgetRead]
    trend: list[RecoveryTrendPointRead]
    recommendations: list[str]
    has_minimum_data: bool
