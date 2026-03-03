from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OrderItemSchema(BaseModel):
    product_id: Optional[str] = None
    name:       str
    price:      float
    quantity:   int = 1


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


class OrderUpdate(BaseModel):
    status:           Optional[str] = None
    payment_status:   Optional[str] = None
    delivery_method:  Optional[str] = None
    delivery_address: Optional[str] = None
    notes:            Optional[str] = None


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