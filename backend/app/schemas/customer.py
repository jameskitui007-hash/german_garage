from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import re


class CustomerUpdate(BaseModel):
    name:   Optional[str] = None
    phone:  Optional[str] = None
    email:  Optional[str] = None
    is_vip: Optional[bool] = None

    @validator("email")
    def valid_email(cls, v):
        if v and not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError("Invalid email address")
        return v

    @validator("phone")
    def valid_phone(cls, v):
        if v and not re.match(r"^\+?[\d\s\-]{7,20}$", v):
            raise ValueError("Invalid phone number")
        return v


class CustomerResponse(BaseModel):
    id:           str
    name:         str
    phone:        Optional[str] = None
    email:        Optional[str] = None
    total_orders: int = 0
    total_spent:  float = 0
    is_vip:       bool = False
    last_order:   Optional[datetime] = None
    created_at:   Optional[datetime] = None

    class Config:
        from_attributes = True