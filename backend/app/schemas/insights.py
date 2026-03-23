from typing import Literal

from pydantic import Field

from app.schemas.common import APIModel


class InsightBlockRead(APIModel):
    title: str
    detail: str
    tone: Literal["info", "warning", "success", "danger"] = "info"


class InsightsReadinessRead(APIModel):
    status: Literal["available", "partial", "missing"] = "missing"
    score: int | None = None
    explanation: str
    missing_inputs: list[str] = Field(default_factory=list)


class LoadRecoveryInsightRead(APIModel):
    status: Literal["available", "partial", "missing"] = "missing"
    acute_load: float | None = None
    chronic_load: float | None = None
    acwr: float | None = None
    readiness_trend: float | None = None
    explanation: str


class WeightTrendInsightRead(APIModel):
    status: Literal["available", "partial", "missing"] = "missing"
    current_weight: float | None = None
    previous_weight: float | None = None
    delta_from_previous: float | None = None
    avg_7d: float | None = None
    explanation: str


class SessionFrequencyInsightRead(APIModel):
    status: Literal["available", "partial", "missing"] = "missing"
    bjj_sessions_last_30_days: int = 0
    strength_sessions_last_30_days: int = 0
    weekly_average: float | None = None
    explanation: str


class InsightsOverviewRead(APIModel):
    readiness: InsightsReadinessRead
    weekly_load: int = 0
    bjj_sessions_last_30_days: int = 0
    strength_sessions_last_30_days: int = 0
    health_records_last_14_days: int = 0
    nutrition_logs_last_14_days: int = 0
    data_gaps: list[str] = Field(default_factory=list)
    has_enough_data: bool = False
    patterns: list[InsightBlockRead] = Field(default_factory=list)
    gaps: list[InsightBlockRead] = Field(default_factory=list)
    recommendations: list[InsightBlockRead] = Field(default_factory=list)
    data_impact: list[InsightBlockRead] = Field(default_factory=list)
    load_recovery: LoadRecoveryInsightRead
    weight_trend: WeightTrendInsightRead
    session_frequency: SessionFrequencyInsightRead
