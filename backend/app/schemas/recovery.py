from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import APIModel


class RecoveryMetricWidgetRead(APIModel):
    label: str
    status: Literal["available", "partial", "missing"] = "missing"
    value: float | None = None
    unit: str | None = None
    helper: str
    observed_at: datetime | None = None
    source: str | None = None
    reason_unavailable: str | None = None
    missing_inputs: list[str] = Field(default_factory=list)


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
