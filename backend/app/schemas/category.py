"""
schemas/category.py
───────────────────
Pydantic models for the Category API.
Used for request validation and response serialization.
"""

import re
from pydantic import BaseModel, field_validator
from typing import Optional


class CategoryCreate(BaseModel):
    name:        str
    slug:        Optional[str]  = None   # auto-generated from name if not provided
    description: Optional[str] = None
    sort_order:  Optional[int] = 0

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Category name cannot be empty")
        if len(v) > 200:
            raise ValueError("Category name must be 200 characters or fewer")
        return v

    @field_validator("slug")
    @classmethod
    def slug_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Slugs must be lowercase, hyphen-separated, no spaces
        v = v.strip().lower()
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError(
                "Slug must be lowercase letters, numbers, and hyphens only "
                "(e.g. 'engine-components')"
            )
        if len(v) > 100:
            raise ValueError("Slug must be 100 characters or fewer")
        return v


class CategoryUpdate(BaseModel):
    name:        Optional[str] = None
    slug:        Optional[str] = None
    description: Optional[str] = None
    sort_order:  Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("Category name cannot be empty")
        if len(v) > 200:
            raise ValueError("Category name must be 200 characters or fewer")
        return v

    @field_validator("slug")
    @classmethod
    def slug_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError(
                "Slug must be lowercase letters, numbers, and hyphens only"
            )
        return v


class CategoryResponse(BaseModel):
    id:          int
    slug:        str
    name:        str
    description: Optional[str] = None
    sort_order:  int
    # Total products in this category — useful for admin UI
    # Computed in the router, not from DB relationship directly
    product_count: Optional[int] = None

    class Config:
        from_attributes = True