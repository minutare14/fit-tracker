from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import StringIdMixin, TimestampMixin
from sqlalchemy.orm import relationship


class BjjTechnique(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "bjj_techniques"

    name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(64))
    position: Mapped[str | None] = mapped_column(String(64), nullable=True)
    gi_mode: Mapped[str] = mapped_column(String(16), default="both")
    created_by_user: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    active: Mapped[bool] = mapped_column(default=True)


class BjjSessionTechnique(Base):
    __tablename__ = "bjj_session_techniques"

    session_id: Mapped[str] = mapped_column(ForeignKey("bjj_sessions.id", ondelete="CASCADE"), primary_key=True)
    technique_id: Mapped[str] = mapped_column(ForeignKey("bjj_techniques.id", ondelete="CASCADE"), primary_key=True)
    type: Mapped[str] = mapped_column(String(32), primary_key=True)  # trained, successful, suffered


class BjjSession(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "bjj_sessions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    start_time: Mapped[str | None] = mapped_column(String(16), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    training_type: Mapped[str] = mapped_column(String(32), index=True)
    gi_mode: Mapped[str] = mapped_column(String(16), default="gi")
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coach: Mapped[str | None] = mapped_column(String(255), nullable=True)
    srpe: Mapped[int] = mapped_column(Integer)
    session_load: Mapped[int] = mapped_column(Integer, index=True)
    rounds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    round_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sparring_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    drill_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    technique_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trained_positions: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    trained_techniques: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    successful_techniques: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    suffered_techniques: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    fatigue_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pain_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    session_score: Mapped[int | None] = mapped_column(Integer, nullable=True)


class WeightEntry(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "weight_entries"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    weight_kg: Mapped[float] = mapped_column(Float)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="MANUAL")


class DerivedMetric(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "derived_metrics"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_derived_metrics_user_date"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    daily_load: Mapped[int] = mapped_column(Integer, default=0)
    acute_load: Mapped[float | None] = mapped_column(Float, nullable=True)
    chronic_load: Mapped[float | None] = mapped_column(Float, nullable=True)
    acwr: Mapped[float | None] = mapped_column(Float, nullable=True)
    readiness_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hydration_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class ReadinessSnapshot(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "readiness_snapshots"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    readiness_score: Mapped[int] = mapped_column(Integer)
    hrv_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    resting_hr_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
