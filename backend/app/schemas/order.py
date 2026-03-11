from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime


class OrderItemSchema(BaseModel):
    product_id: Optional[str] = None
    name:       str
    price:      float
    quantity:   int = 1

    @validator("price")
    def price_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @validator("quantity")
    def quantity_must_be_positive(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class OrderCreate(BaseModel):
    customer_name:    Optional[str] = None
    customer_phone:   Optional[str] = None
    customer_email:   Optional[str] = None
    items:            List[OrderItemSchema]
    shipping_fee:     float = 0
    delivery_method:  Optional[str] = "pickup"
    delivery_address: Optional[str] = None
    notes:            Optional[str] = None
    payment_status:   Optional[str] = "pending_payment"

    @validator("items")
    def items_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("Order must contain at least one item")
        return v

    @validator("shipping_fee")
    def shipping_fee_not_negative(cls, v):
        if v < 0:
            raise ValueError("Shipping fee cannot be negative")
        return v


class OrderUpdate(BaseModel):
    status:           Optional[str] = None
    payment_status:   Optional[str] = None
    delivery_method:  Optional[str] = None
    delivery_address: Optional[str] = None
    notes:            Optional[str] = None

    @validator("status")
    def valid_status(cls, v):
        allowed = {"pending", "processing", "ready", "delivered", "cancelled"}
        if v and v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v

    @validator("payment_status")
    def valid_payment_status(cls, v):
        allowed = {"pending_payment", "paid", "refunded"}
        if v and v not in allowed:
            raise ValueError(f"Payment status must be one of: {', '.join(allowed)}")
        return v


class OrderItemResponse(OrderItemSchema):
    id:       int
    order_id: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id:               int
    order_number:     str
    customer_name:    Optional[str] = None
    customer_phone:   Optional[str] = None
    customer_email:   Optional[str] = None
    total:            float
    shipping_fee:     float
    status:           str
    payment_status:   str
    delivery_method:  Optional[str] = None
    delivery_address: Optional[str] = None
    notes:            Optional[str] = None
    date:             Optional[datetime] = None
    updated_at:       Optional[datetime] = None
    items:            List[OrderItemResponse] = []

    class Config:
        from_attributes = True