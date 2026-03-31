from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import StringIdMixin, TimestampMixin
from app.models.integration import IntegrationProvider


class HealthMetric(StringIdMixin, Base):
    __tablename__ = "health_metrics"
    __table_args__ = (UniqueConstraint("user_id", "date", "type", name="uq_health_metrics_user_date_type"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    type: Mapped[str] = mapped_column(String(64), index=True)
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(64))
    source: Mapped[IntegrationProvider] = mapped_column(Enum(IntegrationProvider))
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class NutritionDaily(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "nutrition_daily"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_nutrition_daily_user_date"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    calories: Mapped[int] = mapped_column(Integer, default=0)
    protein: Mapped[float] = mapped_column(Float, default=0)
    carbs: Mapped[float] = mapped_column(Float, default=0)
    fat: Mapped[float] = mapped_column(Float, default=0)
    fiber: Mapped[float | None] = mapped_column(Float, nullable=True)
    water_liters: Mapped[float] = mapped_column(Float, default=0)
    adherent: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[IntegrationProvider] = mapped_column(Enum(IntegrationProvider))
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
