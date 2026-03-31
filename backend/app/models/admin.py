from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id              = Column(String(50), primary_key=True, index=True)
    username        = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name            = Column(String(200), nullable=False)
    role            = Column(String(50), default="admin")   # admin | superadmin
    is_active       = Column(Boolean, default=True)


     # ── Brute-force protection ────────────────────────────────
    # Incremented on every failed login attempt; reset to 0 on success
    failed_login_count = Column(Integer, default=0, nullable=False)

    # Set to UTC now + 15 min after 5 consecutive failures; NULL means not locked
    locked_until       = Column(DateTime(timezone=True), nullable=True)


    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())