from datetime import datetime

from pydantic import Field

from app.schemas.common import APIModel


class HealthDataPoint(APIModel):
    date: datetime
    qty: float | None = None
    value: float | None = None
    avg: float | None = None


class HealthMetricPayload(APIModel):
    name: str
    units: str
    data: list[HealthDataPoint] = Field(default_factory=list)


class HealthAutoExportData(APIModel):
    metrics: list[HealthMetricPayload] = Field(default_factory=list)
    workouts: list[dict] = Field(default_factory=list)


class HealthAutoExportWebhookPayload(APIModel):
    user_id: str = Field(default="default-user")
    data: HealthAutoExportData


class WebhookIngestResult(APIModel):
    success: bool
    processed: int
    errors: int
