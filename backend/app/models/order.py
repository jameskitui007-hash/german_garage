from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    order_number   = Column(String(50), unique=True, index=True, nullable=False)  # e.g. ORD-202401-001

    # Customer info (denormalized for quick access)
    customer_name  = Column(String(200), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    customer_email = Column(String(200), nullable=True)

    # Financials
    total          = Column(Float, default=0)
    shipping_fee   = Column(Float, default=0)

    # Status
    status         = Column(String(50), default="pending")         # pending | processing | shipped | delivered | cancelled
    payment_status = Column(String(50), default="pending_payment") # paid | pending_payment

    # Delivery
    delivery_method  = Column(String(50), default="pickup")        # pickup | nairobi | outside
    delivery_address = Column(Text, nullable=True)

    # Notes
    notes          = Column(Text, nullable=True)

    date           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship — one order has many items
    items          = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    order_id   = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=True)
    name       = Column(String(200), nullable=False)   # snapshot of product name at time of order
    price      = Column(Float, nullable=False)          # snapshot of price at time of order
    quantity   = Column(Integer, default=1)

    # Relationship back to order
    order      = relationship("Order", back_populates="items")