from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    name              = Column(String(200), nullable=False)
    contact_person    = Column(String(200), nullable=True)
    phone             = Column(String(20), nullable=True)
    email             = Column(String(200), nullable=True)
    products_supplied = Column(Text, nullable=True)   # comma-separated list
    status            = Column(String(20), default="active")  # active | inactive
    last_order        = Column(DateTime(timezone=True), nullable=True)

    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())