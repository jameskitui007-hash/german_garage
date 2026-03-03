from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    sku:         str
    name:        str
    brand:       str
    category:    str
    type:        Optional[str] = "genuine"
    oem_number:  Optional[str] = None
    price:       float
    cost:        Optional[float] = None
    stock:       int = 0
    min_stock:   int = 5
    description: Optional[str] = None
    supplier:    Optional[str] = None
    location:    Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    """All fields optional for partial updates."""
    sku:         Optional[str] = None
    name:        Optional[str] = None
    brand:       Optional[str] = None
    category:    Optional[str] = None
    type:        Optional[str] = None
    oem_number:  Optional[str] = None
    price:       Optional[float] = None
    cost:        Optional[float] = None
    stock:       Optional[int] = None
    min_stock:   Optional[int] = None
    description: Optional[str] = None
    supplier:    Optional[str] = None
    location:    Optional[str] = None


class ProductResponse(ProductBase):
    id:         str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows SQLAlchemy model → Pydantic conversion