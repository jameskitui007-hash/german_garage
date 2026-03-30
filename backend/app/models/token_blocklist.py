from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class TokenBlocklist(Base):
    """
    Stores invalidated JWT IDs (jti claims).
    When an admin logs out, their token's jti is written here.
    The auth dependency rejects any token whose jti is found in this table.
    """
    __tablename__ = "token_blocklist"

    # jti is a UUID string — use it as the primary key for O(1) lookups
    jti        = Column(String(36), primary_key=True, index=True, nullable=False)

    # When this token was invalidated (for cleanup/audit purposes)
    revoked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Which admin revoked it (for audit trail)
    username   = Column(String(100), nullable=True)