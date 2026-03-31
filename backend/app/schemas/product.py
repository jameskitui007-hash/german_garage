import re
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.utils.sanitize import strip_html


# ── Allowed values ─────────────────────────────────────────────
ALLOWED_BRANDS      = {"mercedes", "bmw"}
ALLOWED_CATEGORIES  = {"brakes", "filters", "engine", "suspension", "electrical", "body"}
ALLOWED_TYPES       = {"genuine", "oem", "aftermarket"}


class ProductCreate(BaseModel):
    sku:         str
    name:        str
    brand:       str
    category:    str
    type:        Optional[str]  = "genuine"
    oem_number:  Optional[str]  = None
    price:       float
    cost:        Optional[float] = None
    stock:       int             = 0
    min_stock:   int             = 5
    description: Optional[str]  = None
    supplier:    Optional[str]  = None
    location:    Optional[str]  = None

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("SKU cannot be empty")
        if len(v) > 50:
            raise ValueError("SKU must be 50 characters or fewer")
        # Only allow alphanumeric, dashes, underscores
        if not re.match(r"^[A-Z0-9\-_]+$", v):
            raise ValueError("SKU may only contain letters, numbers, dashes, and underscores")
        return v

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        v = strip_html(v.strip())
        if not v:
            raise ValueError("Product name cannot be empty")
        if len(v) > 200:
            raise ValueError("Product name must be 200 characters or fewer")
        return v

    @field_validator("brand")
    @classmethod
    def validate_brand(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ALLOWED_BRANDS:
            raise ValueError(f"brand must be one of: {ALLOWED_BRANDS}")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ALLOWED_CATEGORIES:
            raise ValueError(f"category must be one of: {ALLOWED_CATEGORIES}")
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v and v.lower() not in ALLOWED_TYPES:
            raise ValueError(f"type must be one of: {ALLOWED_TYPES}")
        return v.lower() if v else v

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @field_validator("cost")
    @classmethod
    def cost_must_be_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Cost cannot be negative")
        return v

    @field_validator("stock")
    @classmethod
    def stock_must_be_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Stock cannot be negative")
        return v

    @field_validator("min_stock")
    @classmethod
    def min_stock_must_be_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Minimum stock must be at least 1")
        return v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:2000]  # cap at 2000 chars

    @field_validator("supplier")
    @classmethod
    def sanitize_supplier(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:200]

    @field_validator("location")
    @classmethod
    def sanitize_location(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:100]

    @field_validator("oem_number")
    @classmethod
    def sanitize_oem_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:100]


class ProductUpdate(BaseModel):
    sku:         Optional[str]   = None
    name:        Optional[str]   = None
    brand:       Optional[str]   = None
    category:    Optional[str]   = None
    type:        Optional[str]   = None
    oem_number:  Optional[str]   = None
    price:       Optional[float] = None
    cost:        Optional[float] = None
    stock:       Optional[int]   = None
    min_stock:   Optional[int]   = None
    description: Optional[str]   = None
    supplier:    Optional[str]   = None
    location:    Optional[str]   = None

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = strip_html(v.strip())
        if len(v) > 200:
            raise ValueError("Product name must be 200 characters or fewer")
        return v

    @field_validator("brand")
    @classmethod
    def validate_brand(cls, v: Optional[str]) -> Optional[str]:
        if v and v.lower() not in ALLOWED_BRANDS:
            raise ValueError(f"brand must be one of: {ALLOWED_BRANDS}")
        return v.lower() if v else v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v and v.lower() not in ALLOWED_CATEGORIES:
            raise ValueError(f"category must be one of: {ALLOWED_CATEGORIES}")
        return v.lower() if v else v

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @field_validator("stock")
    @classmethod
    def stock_must_be_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Stock cannot be negative")
        return v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:2000]

    @field_validator("supplier")
    @classmethod
    def sanitize_supplier(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:200]

    @field_validator("location")
    @classmethod
    def sanitize_location(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return strip_html(v.strip())[:100]


class ProductResponse(BaseModel):
    id:          str
    sku:         str
    name:        str
    brand:       str
    category:    str
    type:        Optional[str]   = None
    oem_number:  Optional[str]   = None
    price:       float
    cost:        Optional[float] = None
    stock:       int
    min_stock:   int
    description: Optional[str]   = None
    supplier:    Optional[str]   = None
    location:    Optional[str]   = None
    created_at:  Optional[datetime] = None
    updated_at:  Optional[datetime] = None

    class Config:
        from_attributes = True