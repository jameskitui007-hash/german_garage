import re
from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
from app.utils.sanitize import strip_html


# ── Allowed values for enum-like fields ───────────────────────
ALLOWED_DELIVERY_METHODS = {"pickup", "nairobi", "outside"}
ALLOWED_STATUSES         = {"pending", "processing", "shipped", "delivered", "cancelled"}
ALLOWED_PAYMENT_STATUSES = {"paid", "pending_payment"}


class OrderItemSchema(BaseModel):
    product_id: Optional[str] = None
    name:       str
    price:      float
    quantity:   int = 1

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return strip_html(v)

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        if v > 1000:
            raise ValueError("Quantity cannot exceed 1000")
        return v


class OrderCreate(BaseModel):
    customer_name:    Optional[str]  = None
    customer_phone:   Optional[str]  = None
    customer_email:   Optional[str]  = None
    items:            List[OrderItemSchema]
    shipping_fee:     float          = 0
    delivery_method:  Optional[str]  = "pickup"
    delivery_address: Optional[str]  = None
    notes:            Optional[str]  = None
    payment_status:   Optional[str]  = "pending_payment"

    @field_validator("customer_name")
    @classmethod
    def sanitize_customer_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = strip_html(v.strip())
        if len(v) > 200:
            raise ValueError("Customer name must be 200 characters or fewer")
        return v

    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        # Allow +, digits, spaces, dashes, brackets — standard phone formats
        if not re.match(r"^\+?[\d\s\-().]{7,20}$", v):
            raise ValueError("Invalid phone number format")
        return v

    @field_validator("customer_email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        # Basic email format check
        if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email address format")
        if len(v) > 254:
            raise ValueError("Email address is too long")
        return v

    @field_validator("delivery_method")
    @classmethod
    def validate_delivery_method(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ALLOWED_DELIVERY_METHODS:
            raise ValueError(f"delivery_method must be one of: {ALLOWED_DELIVERY_METHODS}")
        return v

    @field_validator("delivery_address")
    @classmethod
    def sanitize_address(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:500]   # cap at 500 chars

    @field_validator("notes")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:1000]  # cap at 1000 chars

    @field_validator("shipping_fee")
    @classmethod
    def shipping_fee_must_be_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Shipping fee cannot be negative")
        return v

    @field_validator("items")
    @classmethod
    def items_must_not_be_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Order must contain at least one item")
        if len(v) > 100:
            raise ValueError("Order cannot contain more than 100 items")
        return v


class OrderUpdate(BaseModel):
    status:           Optional[str] = None
    payment_status:   Optional[str] = None
    delivery_method:  Optional[str] = None
    delivery_address: Optional[str] = None
    notes:            Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ALLOWED_STATUSES:
            raise ValueError(f"status must be one of: {ALLOWED_STATUSES}")
        return v

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ALLOWED_PAYMENT_STATUSES:
            raise ValueError(f"payment_status must be one of: {ALLOWED_PAYMENT_STATUSES}")
        return v

    @field_validator("notes")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:1000]

    @field_validator("delivery_address")
    @classmethod
    def sanitize_address(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:500]


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