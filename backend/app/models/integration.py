import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import StringIdMixin, TimestampMixin


class IntegrationProvider(str, enum.Enum):
    HEVY = "HEVY"
    HEALTH_AUTO_EXPORT = "HEALTH_AUTO_EXPORT"
    NUTRITION_MANUAL = "NUTRITION_MANUAL"
    AI = "AI"


class SyncStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    IN_PROGRESS = "IN_PROGRESS"


class IntegrationConnection(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "integration_connections"
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_integration_connections_user_provider"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[IntegrationProvider] = mapped_column(Enum(IntegrationProvider), index=True)
    status: Mapped[str] = mapped_column(String(32), default="DISCONNECTED")
    api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    credentials: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user = relationship("User")
    sync_runs = relationship("SyncRun", back_populates="connection")


class SyncRun(StringIdMixin, Base):
    __tablename__ = "sync_runs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    connection_id: Mapped[str] = mapped_column(ForeignKey("integration_connections.id"), index=True)
    provider: Mapped[IntegrationProvider] = mapped_column(Enum(IntegrationProvider), index=True)
    sync_type: Mapped[str] = mapped_column(String(64), default="WORKOUTS")
    status: Mapped[SyncStatus] = mapped_column(Enum(SyncStatus), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    records_created: Mapped[int] = mapped_column(Integer, default=0)
    records_updated: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    connection = relationship("IntegrationConnection", back_populates="sync_runs")


class RawEvent(StringIdMixin, Base):
    __tablename__ = "raw_events"

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    provider: Mapped[IntegrationProvider] = mapped_column(Enum(IntegrationProvider), index=True)
    event_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    external_event_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    payload_json: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class IntegrationSecret(StringIdMixin, TimestampMixin, Base):
    __tablename__ = "integration_secrets"
    __table_args__ = (UniqueConstraint("user_id", "provider", "key", name="uq_integration_secrets_user_provider_key"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[IntegrationProvider] = mapped_column(Enum(IntegrationProvider), index=True)
    key: Mapped[str] = mapped_column(String(128))
    encrypted_value: Mapped[str] = mapped_column(Text)
    value_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    last4: Mapped[str | None] = mapped_column(String(8), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
