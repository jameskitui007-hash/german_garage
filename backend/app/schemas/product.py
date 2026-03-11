from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

VALID_BRANDS     = {"mercedes", "bmw"}
VALID_CATEGORIES = {"filters", "brakes", "engine", "suspension", "electrical", "body"}
VALID_TYPES      = {"genuine", "oem", "aftermarket"}


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

    @validator("sku")
    def sku_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("SKU cannot be empty")
        return v.strip().upper()

    @validator("name")
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()

    @validator("brand")
    def valid_brand(cls, v):
        if v.lower() not in VALID_BRANDS:
            raise ValueError(f"Brand must be one of: {', '.join(VALID_BRANDS)}")
        return v.lower()

    @validator("category")
    def valid_category(cls, v):
        if v.lower() not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return v.lower()

    @validator("type")
    def valid_type(cls, v):
        if v and v.lower() not in VALID_TYPES:
            raise ValueError(f"Type must be one of: {', '.join(VALID_TYPES)}")
        return v.lower() if v else v

    @validator("price")
    def price_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @validator("cost")
    def cost_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Cost cannot be negative")
        return v

    @validator("stock")
    def stock_not_negative(cls, v):
        if v < 0:
            raise ValueError("Stock cannot be negative")
        return v

    @validator("min_stock")
    def min_stock_not_negative(cls, v):
        if v < 0:
            raise ValueError("Min stock cannot be negative")
        return v


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

    @validator("brand")
    def valid_brand(cls, v):
        if v and v.lower() not in VALID_BRANDS:
            raise ValueError(f"Brand must be one of: {', '.join(VALID_BRANDS)}")
        return v.lower() if v else v

    @validator("category")
    def valid_category(cls, v):
        if v and v.lower() not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return v.lower() if v else v

    @validator("price")
    def price_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @validator("stock")
    def stock_not_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Stock cannot be negative")
        return v


class ProductResponse(ProductBase):
    id:         str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True