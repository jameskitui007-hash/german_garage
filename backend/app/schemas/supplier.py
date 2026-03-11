from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import re

VALID_STATUSES = {"active", "inactive"}


class SupplierCreate(BaseModel):
    name:              str
    contact_person:    Optional[str] = None
    phone:             Optional[str] = None
    email:             Optional[str] = None
    products_supplied: Optional[str] = None
    status:            Optional[str] = "active"

    @validator("name")
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Supplier name cannot be empty")
        return v.strip()

    @validator("status")
    def valid_status(cls, v):
        if v and v.lower() not in VALID_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(VALID_STATUSES)}")
        return v.lower() if v else v

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


class SupplierUpdate(BaseModel):
    name:              Optional[str] = None
    contact_person:    Optional[str] = None
    phone:             Optional[str] = None
    email:             Optional[str] = None
    products_supplied: Optional[str] = None
    status:            Optional[str] = None
    last_order:        Optional[datetime] = None

    @validator("status")
    def valid_status(cls, v):
        if v and v.lower() not in VALID_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(VALID_STATUSES)}")
        return v.lower() if v else v

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


class SupplierResponse(SupplierCreate):
    id:         int
    last_order: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True