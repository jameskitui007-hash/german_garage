from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Setting(Base):
    __tablename__ = "settings"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    key        = Column(String(100), unique=True, index=True, nullable=False)  # e.g. store_name
    value      = Column(Text, nullable=True)                                   # e.g. Mercedes & BMW Parts
    group      = Column(String(50), nullable=True)   # store | pricing | delivery | payment

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())