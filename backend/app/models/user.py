from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import StringIdMixin, TimestampMixin


class User(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    belt: Mapped[str | None] = mapped_column(String(32), nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    calories_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    protein_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    weekly_load_target: Mapped[float | None] = mapped_column(Float, nullable=True)

    profile = relationship("UserProfile", back_populates="user", uselist=False)


class UserProfile(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sex: Mapped[str | None] = mapped_column(String(32), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    belt_rank: Mapped[str | None] = mapped_column(String(32), nullable=True)
    academy_team: Mapped[str | None] = mapped_column(String(255), nullable=True)
    primary_goal: Mapped[str | None] = mapped_column(String(255), nullable=True)
    injuries_restrictions: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="America/Bahia")
    unit_system: Mapped[str] = mapped_column(String(32), default="metric")
    hydration_target_liters: Mapped[float | None] = mapped_column(Float, nullable=True)

    user = relationship("User", back_populates="profile")
