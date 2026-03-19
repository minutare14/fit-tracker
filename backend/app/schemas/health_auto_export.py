from datetime import datetime

from pydantic import BaseModel, Field


class HealthDataPoint(BaseModel):
    date: datetime
    qty: float | None = None
    value: float | None = None
    avg: float | None = None


class HealthMetricPayload(BaseModel):
    name: str
    units: str
    data: list[HealthDataPoint] = Field(default_factory=list)


class HealthAutoExportData(BaseModel):
    metrics: list[HealthMetricPayload] = Field(default_factory=list)
    workouts: list[dict] = Field(default_factory=list)


class HealthAutoExportWebhookPayload(BaseModel):
    user_id: str = Field(default="default-user")
    data: HealthAutoExportData


class WebhookIngestResult(BaseModel):
    success: bool
    processed: int
    errors: int
