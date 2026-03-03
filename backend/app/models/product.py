from sqlalchemy import Column, String, Integer, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id          = Column(String(50), primary_key=True, index=True)  # e.g. prod_1234
    sku         = Column(String(50), unique=True, index=True, nullable=False)
    name        = Column(String(200), nullable=False)
    brand       = Column(String(50), nullable=False)        # mercedes | bmw
    category    = Column(String(50), nullable=False)        # brakes | filters | engine etc.
    type        = Column(String(50), default="genuine")     # genuine | oem | aftermarket
    oem_number  = Column(String(100), nullable=True)
    price       = Column(Float, nullable=False)             # selling price
    cost        = Column(Float, nullable=True)              # cost price
    stock       = Column(Integer, default=0)
    min_stock   = Column(Integer, default=5)                # low stock threshold
    description = Column(Text, nullable=True)
    supplier    = Column(String(200), nullable=True)
    location    = Column(String(100), nullable=True)        # shelf location e.g. Shelf A-12

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())