"""merge heads

Revision ID: 8d7e462a2fa1
Revises: 42ad52c4fa10, 3393d4b194d1
Create Date: 2026-04-06 02:09:01.632991

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d7e462a2fa1'
down_revision: Union[str, Sequence[str], None] = ('42ad52c4fa10', '3393d4b194d1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
