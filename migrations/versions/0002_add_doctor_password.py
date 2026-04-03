"""add doctor hashed_password

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-03 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "doctors",
        sa.Column("hashed_password", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("doctors", "hashed_password")
