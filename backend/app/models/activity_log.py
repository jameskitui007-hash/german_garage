from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    action    = Column(String(100), nullable=False)   # e.g. login | add_product | delete_order
    details   = Column(Text, nullable=True)           # human readable description
    user      = Column(String(100), nullable=True)    # admin username who performed action
    ip        = Column(String(50), nullable=True)     # request IP address

    timestamp = Column(DateTime(timezone=True), server_default=func.now())