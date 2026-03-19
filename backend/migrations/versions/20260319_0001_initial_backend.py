"""initial backend schema

Revision ID: 20260319_0001
Revises:
Create Date: 2026-03-19 11:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260319_0001"
down_revision = None
branch_labels = None
depends_on = None


integrationprovider = sa.Enum(
    "HEVY",
    "HEALTH_AUTO_EXPORT",
    "NUTRITION_MANUAL",
    name="integrationprovider",
)
syncstatus = sa.Enum("SUCCESS", "FAILURE", "IN_PROGRESS", name="syncstatus")


def upgrade() -> None:
    integrationprovider.create(op.get_bind(), checkfirst=True)
    syncstatus.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=True, unique=True),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("belt", sa.String(length=32), nullable=True),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "integration_connections",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", integrationprovider, nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("api_key", sa.String(length=255), nullable=True),
        sa.Column("external_user_id", sa.String(length=255), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("credentials", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "provider", name="uq_integration_connections_user_provider"),
    )
    op.create_index("ix_integration_connections_user_id", "integration_connections", ["user_id"])
    op.create_index("ix_integration_connections_provider", "integration_connections", ["provider"])

    op.create_table(
        "sync_runs",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("connection_id", sa.String(length=32), sa.ForeignKey("integration_connections.id"), nullable=False),
        sa.Column("provider", integrationprovider, nullable=False),
        sa.Column("sync_type", sa.String(length=64), nullable=False),
        sa.Column("status", syncstatus, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("records_processed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_updated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
    )
    op.create_index("ix_sync_runs_user_id", "sync_runs", ["user_id"])
    op.create_index("ix_sync_runs_connection_id", "sync_runs", ["connection_id"])
    op.create_index("ix_sync_runs_provider", "sync_runs", ["provider"])
    op.create_index("ix_sync_runs_status", "sync_runs", ["status"])

    op.create_table(
        "raw_events",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("provider", integrationprovider, nullable=False),
        sa.Column("event_type", sa.String(length=128), nullable=True),
        sa.Column("external_event_id", sa.String(length=255), nullable=True),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_raw_events_user_id", "raw_events", ["user_id"])
    op.create_index("ix_raw_events_provider", "raw_events", ["provider"])
    op.create_index("ix_raw_events_external_event_id", "raw_events", ["external_event_id"])

    op.create_table(
        "hevy_exercise_templates",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("external_template_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=True),
        sa.Column("primary_muscle", sa.String(length=128), nullable=True),
        sa.Column("secondary_muscles", sa.JSON(), nullable=True),
        sa.Column("equipment", sa.String(length=128), nullable=True),
        sa.Column("is_custom", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("raw_payload_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("external_template_id", name="uq_hevy_exercise_templates_external_template_id"),
    )
    op.create_index("ix_hevy_exercise_templates_external_template_id", "hevy_exercise_templates", ["external_template_id"])

    op.create_table(
        "hevy_workouts",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("external_workout_id", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=False, server_default="Hevy"),
        sa.Column("raw_payload_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("external_workout_id", name="uq_hevy_workouts_external_workout_id"),
    )
    op.create_index("ix_hevy_workouts_user_id", "hevy_workouts", ["user_id"])
    op.create_index("ix_hevy_workouts_external_workout_id", "hevy_workouts", ["external_workout_id"])
    op.create_index("ix_hevy_workouts_started_at", "hevy_workouts", ["started_at"])

    op.create_table(
        "hevy_workout_exercises",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("workout_id", sa.String(length=32), sa.ForeignKey("hevy_workouts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("external_exercise_id", sa.String(length=128), nullable=True),
        sa.Column("exercise_template_id", sa.String(length=64), nullable=True),
        sa.Column("exercise_name", sa.String(length=255), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("raw_payload_json", sa.JSON(), nullable=True),
    )
    op.create_index("ix_hevy_workout_exercises_workout_id", "hevy_workout_exercises", ["workout_id"])

    op.create_table(
        "hevy_sets",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("exercise_id", sa.String(length=32), sa.ForeignKey("hevy_workout_exercises.id", ondelete="CASCADE"), nullable=False),
        sa.Column("external_set_id", sa.String(length=128), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("set_type", sa.String(length=32), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("distance_m", sa.Float(), nullable=True),
        sa.Column("is_warmup", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("raw_payload_json", sa.JSON(), nullable=True),
    )
    op.create_index("ix_hevy_sets_exercise_id", "hevy_sets", ["exercise_id"])

    op.create_table(
        "health_metrics",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("type", sa.String(length=64), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=64), nullable=False),
        sa.Column("source", integrationprovider, nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=True),
        sa.UniqueConstraint("user_id", "date", "type", name="uq_health_metrics_user_date_type"),
    )
    op.create_index("ix_health_metrics_user_id", "health_metrics", ["user_id"])
    op.create_index("ix_health_metrics_date", "health_metrics", ["date"])
    op.create_index("ix_health_metrics_type", "health_metrics", ["type"])

    op.create_table(
        "nutrition_daily",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("calories", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("protein", sa.Float(), nullable=False, server_default="0"),
        sa.Column("carbs", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fat", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fiber", sa.Float(), nullable=True),
        sa.Column("water_liters", sa.Float(), nullable=False, server_default="0"),
        sa.Column("adherent", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("source", integrationprovider, nullable=False),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "date", name="uq_nutrition_daily_user_date"),
    )
    op.create_index("ix_nutrition_daily_user_id", "nutrition_daily", ["user_id"])
    op.create_index("ix_nutrition_daily_date", "nutrition_daily", ["date"])

    op.create_table(
        "daily_rollups",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bjj_load", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("strength_volume_kg", sa.Float(), nullable=False, server_default="0"),
        sa.Column("recovery_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sleep_hours", sa.Float(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("readiness_label", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "date", name="uq_daily_rollups_user_date"),
    )
    op.create_index("ix_daily_rollups_user_id", "daily_rollups", ["user_id"])
    op.create_index("ix_daily_rollups_date", "daily_rollups", ["date"])


def downgrade() -> None:
    op.drop_index("ix_daily_rollups_date", table_name="daily_rollups")
    op.drop_index("ix_daily_rollups_user_id", table_name="daily_rollups")
    op.drop_table("daily_rollups")

    op.drop_index("ix_nutrition_daily_date", table_name="nutrition_daily")
    op.drop_index("ix_nutrition_daily_user_id", table_name="nutrition_daily")
    op.drop_table("nutrition_daily")

    op.drop_index("ix_health_metrics_type", table_name="health_metrics")
    op.drop_index("ix_health_metrics_date", table_name="health_metrics")
    op.drop_index("ix_health_metrics_user_id", table_name="health_metrics")
    op.drop_table("health_metrics")

    op.drop_index("ix_hevy_sets_exercise_id", table_name="hevy_sets")
    op.drop_table("hevy_sets")

    op.drop_index("ix_hevy_workout_exercises_workout_id", table_name="hevy_workout_exercises")
    op.drop_table("hevy_workout_exercises")

    op.drop_index("ix_hevy_workouts_started_at", table_name="hevy_workouts")
    op.drop_index("ix_hevy_workouts_external_workout_id", table_name="hevy_workouts")
    op.drop_index("ix_hevy_workouts_user_id", table_name="hevy_workouts")
    op.drop_table("hevy_workouts")

    op.drop_index("ix_hevy_exercise_templates_external_template_id", table_name="hevy_exercise_templates")
    op.drop_table("hevy_exercise_templates")

    op.drop_index("ix_raw_events_external_event_id", table_name="raw_events")
    op.drop_index("ix_raw_events_provider", table_name="raw_events")
    op.drop_index("ix_raw_events_user_id", table_name="raw_events")
    op.drop_table("raw_events")

    op.drop_index("ix_sync_runs_status", table_name="sync_runs")
    op.drop_index("ix_sync_runs_provider", table_name="sync_runs")
    op.drop_index("ix_sync_runs_connection_id", table_name="sync_runs")
    op.drop_index("ix_sync_runs_user_id", table_name="sync_runs")
    op.drop_table("sync_runs")

    op.drop_index("ix_integration_connections_provider", table_name="integration_connections")
    op.drop_index("ix_integration_connections_user_id", table_name="integration_connections")
    op.drop_table("integration_connections")

    op.drop_table("users")

    syncstatus.drop(op.get_bind(), checkfirst=True)
    integrationprovider.drop(op.get_bind(), checkfirst=True)
