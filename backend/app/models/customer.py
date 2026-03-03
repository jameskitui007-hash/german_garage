from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id           = Column(String(50), primary_key=True, index=True)  # e.g. cust_1234
    name         = Column(String(200), nullable=False)
    phone        = Column(String(20), unique=True, index=True, nullable=True)
    email        = Column(String(200), nullable=True)
    total_orders = Column(Integer, default=0)
    total_spent  = Column(Float, default=0)
    is_vip       = Column(Boolean, default=False)
    last_order   = Column(DateTime(timezone=True), nullable=True)

    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())