"""align python rebuild schema

Revision ID: 20260323_0003
Revises: 26fcf71a7ef4
Create Date: 2026-03-23 11:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260323_0003"
down_revision = "26fcf71a7ef4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("bjj_sessions", sa.Column("round_rest_minutes", sa.Integer(), nullable=True))
    op.add_column("bjj_sessions", sa.Column("injury_notes", sa.Text(), nullable=True))
    op.create_unique_constraint(
        "uq_readiness_snapshots_user_date",
        "readiness_snapshots",
        ["user_id", "date"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_readiness_snapshots_user_date", "readiness_snapshots", type_="unique")
    op.drop_column("bjj_sessions", "injury_notes")
    op.drop_column("bjj_sessions", "round_rest_minutes")
