from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import StringIdMixin, TimestampMixin


class DailyRollup(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "daily_rollups"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_daily_rollups_user_date"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    bjj_load: Mapped[int] = mapped_column(Integer, default=0)
    strength_volume_kg: Mapped[float] = mapped_column(Float, default=0)
    recovery_score: Mapped[int] = mapped_column(Integer, default=0)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    readiness_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bjj_sessions_count: Mapped[int] = mapped_column(Integer, default=0)
    total_bjj_minutes: Mapped[int] = mapped_column(Integer, default=0)
    total_session_load: Mapped[int] = mapped_column(Integer, default=0)
    calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    protein_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    hydration_ml: Mapped[float | None] = mapped_column(Float, nullable=True)
