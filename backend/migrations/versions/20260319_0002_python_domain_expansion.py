"""expand python domain models for profile, bjj, secrets and derived metrics

Revision ID: 20260319_0002
Revises: 20260319_0001
Create Date: 2026-03-19 15:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260319_0002"
down_revision = "20260319_0001"
branch_labels = None
depends_on = None


integrationprovider = postgresql.ENUM(
    "HEVY",
    "HEALTH_AUTO_EXPORT",
    "NUTRITION_MANUAL",
    "AI",
    name="integrationprovider",
    create_type=False,
)


def upgrade() -> None:
    op.execute("ALTER TYPE integrationprovider ADD VALUE IF NOT EXISTS 'AI'")

    op.add_column("users", sa.Column("calories_target", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("protein_target", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("carbs_target", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("fat_target", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("sleep_target", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("weekly_load_target", sa.Float(), nullable=True))

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("sex", sa.String(length=32), nullable=True),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("current_weight_kg", sa.Float(), nullable=True),
        sa.Column("target_category", sa.String(length=64), nullable=True),
        sa.Column("belt_rank", sa.String(length=32), nullable=True),
        sa.Column("academy_team", sa.String(length=255), nullable=True),
        sa.Column("primary_goal", sa.String(length=255), nullable=True),
        sa.Column("injuries_restrictions", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="America/Bahia"),
        sa.Column("unit_system", sa.String(length=32), nullable=False, server_default="metric"),
        sa.Column("hydration_target_liters", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", name="uq_user_profiles_user_id"),
    )
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"])

    op.create_table(
        "integration_secrets",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", integrationprovider, nullable=False),
        sa.Column("key", sa.String(length=128), nullable=False),
        sa.Column("encrypted_value", sa.Text(), nullable=False),
        sa.Column("value_hash", sa.String(length=128), nullable=True),
        sa.Column("last4", sa.String(length=8), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "provider", "key", name="uq_integration_secrets_user_provider_key"),
    )
    op.create_index("ix_integration_secrets_user_id", "integration_secrets", ["user_id"])
    op.create_index("ix_integration_secrets_provider", "integration_secrets", ["provider"])

    op.create_table(
        "bjj_sessions",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("start_time", sa.String(length=16), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("training_type", sa.String(length=32), nullable=False),
        sa.Column("gi_mode", sa.String(length=16), nullable=False, server_default="gi"),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("coach", sa.String(length=255), nullable=True),
        sa.Column("srpe", sa.Integer(), nullable=False),
        sa.Column("session_load", sa.Integer(), nullable=False),
        sa.Column("rounds", sa.Integer(), nullable=True),
        sa.Column("sparring_minutes", sa.Integer(), nullable=True),
        sa.Column("drill_minutes", sa.Integer(), nullable=True),
        sa.Column("technique_minutes", sa.Integer(), nullable=True),
        sa.Column("trained_positions", sa.JSON(), nullable=True),
        sa.Column("trained_techniques", sa.JSON(), nullable=True),
        sa.Column("successful_techniques", sa.JSON(), nullable=True),
        sa.Column("suffered_techniques", sa.JSON(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("fatigue_before", sa.Integer(), nullable=True),
        sa.Column("pain_level", sa.Integer(), nullable=True),
        sa.Column("session_score", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bjj_sessions_user_id", "bjj_sessions", ["user_id"])
    op.create_index("ix_bjj_sessions_date", "bjj_sessions", ["date"])
    op.create_index("ix_bjj_sessions_training_type", "bjj_sessions", ["training_type"])
    op.create_index("ix_bjj_sessions_session_load", "bjj_sessions", ["session_load"])

    op.create_table(
        "weight_entries",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("body_fat_pct", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=32), nullable=False, server_default="MANUAL"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_weight_entries_user_id", "weight_entries", ["user_id"])
    op.create_index("ix_weight_entries_date", "weight_entries", ["date"])

    op.create_table(
        "derived_metrics",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("daily_load", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("acute_load", sa.Float(), nullable=True),
        sa.Column("chronic_load", sa.Float(), nullable=True),
        sa.Column("acwr", sa.Float(), nullable=True),
        sa.Column("readiness_score", sa.Integer(), nullable=True),
        sa.Column("hydration_score", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "date", name="uq_derived_metrics_user_date"),
    )
    op.create_index("ix_derived_metrics_user_id", "derived_metrics", ["user_id"])
    op.create_index("ix_derived_metrics_date", "derived_metrics", ["date"])

    op.create_table(
        "readiness_snapshots",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("readiness_score", sa.Integer(), nullable=False),
        sa.Column("hrv_value", sa.Float(), nullable=True),
        sa.Column("resting_hr_value", sa.Float(), nullable=True),
        sa.Column("sleep_hours", sa.Float(), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_readiness_snapshots_user_id", "readiness_snapshots", ["user_id"])
    op.create_index("ix_readiness_snapshots_date", "readiness_snapshots", ["date"])


def downgrade() -> None:
    op.drop_index("ix_readiness_snapshots_date", table_name="readiness_snapshots")
    op.drop_index("ix_readiness_snapshots_user_id", table_name="readiness_snapshots")
    op.drop_table("readiness_snapshots")

    op.drop_index("ix_derived_metrics_date", table_name="derived_metrics")
    op.drop_index("ix_derived_metrics_user_id", table_name="derived_metrics")
    op.drop_table("derived_metrics")

    op.drop_index("ix_weight_entries_date", table_name="weight_entries")
    op.drop_index("ix_weight_entries_user_id", table_name="weight_entries")
    op.drop_table("weight_entries")

    op.drop_index("ix_bjj_sessions_session_load", table_name="bjj_sessions")
    op.drop_index("ix_bjj_sessions_training_type", table_name="bjj_sessions")
    op.drop_index("ix_bjj_sessions_date", table_name="bjj_sessions")
    op.drop_index("ix_bjj_sessions_user_id", table_name="bjj_sessions")
    op.drop_table("bjj_sessions")

    op.drop_index("ix_integration_secrets_provider", table_name="integration_secrets")
    op.drop_index("ix_integration_secrets_user_id", table_name="integration_secrets")
    op.drop_table("integration_secrets")

    op.drop_index("ix_user_profiles_user_id", table_name="user_profiles")
    op.drop_table("user_profiles")

    op.drop_column("users", "weekly_load_target")
    op.drop_column("users", "sleep_target")
    op.drop_column("users", "fat_target")
    op.drop_column("users", "carbs_target")
    op.drop_column("users", "protein_target")
    op.drop_column("users", "calories_target")
