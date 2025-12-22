"""Add an input hash field for check caching

Revision ID: 0031_2025.12.22_0f049a07
Revises: 0030_2025.12.05_211a31e3
Create Date: 2025-12-22 14:59:17.175444+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# Revision identifiers, used by Alembic
revision: str = "0031_2025.12.22_0f049a07"
down_revision: str | None = "0030_2025.12.05_211a31e3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("checkresult", schema=None) as batch_op:
        batch_op.add_column(sa.Column("input_hash", sa.String(), nullable=True))
        batch_op.create_index(batch_op.f("ix_checkresult_input_hash"), ["input_hash"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("checkresult", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_checkresult_input_hash"))
        batch_op.drop_column("input_hash")
