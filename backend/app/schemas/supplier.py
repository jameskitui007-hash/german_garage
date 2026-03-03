from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SupplierCreate(BaseModel):
    name:              str
    contact_person:    Optional[str] = None
    phone:             Optional[str] = None
    email:             Optional[str] = None
    products_supplied: Optional[str] = None  # comma-separated
    status:            Optional[str] = "active"


class SupplierUpdate(BaseModel):
    name:              Optional[str] = None
    contact_person:    Optional[str] = None
    phone:             Optional[str] = None
    email:             Optional[str] = None
    products_supplied: Optional[str] = None
    status:            Optional[str] = None
    last_order:        Optional[datetime] = None


class SupplierResponse(SupplierCreate):
    id:         int
    last_order: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True