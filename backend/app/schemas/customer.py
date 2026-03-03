from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomerUpdate(BaseModel):
    name:      Optional[str] = None
    phone:     Optional[str] = None
    email:     Optional[str] = None
    is_vip:    Optional[bool] = None


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