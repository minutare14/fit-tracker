"""Align models with BJJ Lab spec

Revision ID: a1b2c3d4e5f6
Revises: 26fcf71a7ef4
Create Date: 2026-03-31
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "26fcf71a7ef4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # user_profiles
    op.add_column("user_profiles", sa.Column("target_weight_kg", sa.Float(), nullable=True))
    op.add_column("user_profiles", sa.Column("weight_unit", sa.String(16), server_default="kg", nullable=False))
    op.add_column("user_profiles", sa.Column("calorie_target", sa.Float(), nullable=True))
    op.add_column("user_profiles", sa.Column("protein_target_g", sa.Float(), nullable=True))
    op.add_column("user_profiles", sa.Column("carbs_target_g", sa.Float(), nullable=True))
    op.add_column("user_profiles", sa.Column("fat_target_g", sa.Float(), nullable=True))
    op.add_column("user_profiles", sa.Column("hydration_target_ml", sa.Float(), nullable=True))

    # bjj_session_techniques
    op.add_column("bjj_session_techniques", sa.Column("notes", sa.Text(), nullable=True))

    # daily_rollups
    op.add_column("daily_rollups", sa.Column("bjj_sessions_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("daily_rollups", sa.Column("total_bjj_minutes", sa.Integer(), server_default="0", nullable=False))
    op.add_column("daily_rollups", sa.Column("total_session_load", sa.Integer(), server_default="0", nullable=False))
    op.add_column("daily_rollups", sa.Column("calories", sa.Float(), nullable=True))
    op.add_column("daily_rollups", sa.Column("protein_g", sa.Float(), nullable=True))
    op.add_column("daily_rollups", sa.Column("carbs_g", sa.Float(), nullable=True))
    op.add_column("daily_rollups", sa.Column("fat_g", sa.Float(), nullable=True))
    op.add_column("daily_rollups", sa.Column("hydration_ml", sa.Float(), nullable=True))

    # derived_metrics
    op.add_column("derived_metrics", sa.Column("weight_delta_vs_previous", sa.Float(), nullable=True))
    op.add_column("derived_metrics", sa.Column("avg_weight_7d", sa.Float(), nullable=True))
    op.add_column("derived_metrics", sa.Column("avg_calories_7d", sa.Float(), nullable=True))
    op.add_column("derived_metrics", sa.Column("avg_protein_7d", sa.Float(), nullable=True))
    op.add_column("derived_metrics", sa.Column("avg_sleep_7d", sa.Float(), nullable=True))

    # health_metrics
    op.add_column("health_metrics", sa.Column("payload_json", sa.JSON(), nullable=True))
    op.add_column("health_metrics", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))

    # readiness_snapshots
    op.add_column("readiness_snapshots", sa.Column("body_temp", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("readiness_snapshots", "body_temp")
    op.drop_column("health_metrics", "created_at")
    op.drop_column("health_metrics", "payload_json")
    op.drop_column("derived_metrics", "avg_sleep_7d")
    op.drop_column("derived_metrics", "avg_protein_7d")
    op.drop_column("derived_metrics", "avg_calories_7d")
    op.drop_column("derived_metrics", "avg_weight_7d")
    op.drop_column("derived_metrics", "weight_delta_vs_previous")
    op.drop_column("daily_rollups", "hydration_ml")
    op.drop_column("daily_rollups", "fat_g")
    op.drop_column("daily_rollups", "carbs_g")
    op.drop_column("daily_rollups", "protein_g")
    op.drop_column("daily_rollups", "calories")
    op.drop_column("daily_rollups", "total_session_load")
    op.drop_column("daily_rollups", "total_bjj_minutes")
    op.drop_column("daily_rollups", "bjj_sessions_count")
    op.drop_column("bjj_session_techniques", "notes")
    op.drop_column("user_profiles", "hydration_target_ml")
    op.drop_column("user_profiles", "fat_target_g")
    op.drop_column("user_profiles", "carbs_target_g")
    op.drop_column("user_profiles", "protein_target_g")
    op.drop_column("user_profiles", "calorie_target")
    op.drop_column("user_profiles", "weight_unit")
    op.drop_column("user_profiles", "target_weight_kg")
