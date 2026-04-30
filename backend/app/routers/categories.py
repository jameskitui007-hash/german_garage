"""
routers/categories.py
─────────────────────
Category CRUD endpoints.

Public endpoints (no auth):
  GET /api/categories          — used by shop filter sidebar
  GET /api/categories/{id}     — single category detail

Admin-only endpoints:
  POST   /api/categories
  PUT    /api/categories/{id}
  DELETE /api/categories/{id}
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.dependencies import get_current_admin
from app.utils.logger import log_activity
from app.utils.slugify import slugify

router = APIRouter(prefix="/api/categories", tags=["Categories"])


# ── GET all categories (PUBLIC) ───────────────────────────────
@router.get("", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db)
):
    """
    Returns all categories ordered by sort_order.
    Public — no auth required.
    Used by the shop filter sidebar and admin product forms.
    """
    categories = db.query(Category).order_by(Category.sort_order).all()

    # Attach product_count to each category
    result = []
    for cat in categories:
        # Count products in this category
        count = db.query(Product).filter(
            Product.category_id == cat.id
        ).count()

        result.append(CategoryResponse(
            id            = cat.id,
            slug          = cat.slug,
            name          = cat.name,
            description   = cat.description,
            sort_order    = cat.sort_order,
            product_count = count,
        ))

    return result


# ── GET single category (PUBLIC) ─────────────────────────────
@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns a single category by ID.
    Public — no auth required.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    count = db.query(Product).filter(Product.category_id == cat.id).count()

    return CategoryResponse(
        id            = cat.id,
        slug          = cat.slug,
        name          = cat.name,
        description   = cat.description,
        sort_order    = cat.sort_order,
        product_count = count,
    )


# ── POST create category (ADMIN) ──────────────────────────────
@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    payload: CategoryCreate,
    db:      Session = Depends(get_db),
    admin    = Depends(get_current_admin)
):
    """
    Creates a new category.
    Auto-generates slug from name if not provided.
    Admin only.
    """
    # Auto-generate slug from name if not supplied
    final_slug = payload.slug or slugify(payload.name)

    # Check slug uniqueness
    if db.query(Category).filter(Category.slug == final_slug).first():
        raise HTTPException(
            status_code=400,
            detail=f"A category with slug '{final_slug}' already exists"
        )

    cat = Category(
        slug        = final_slug,
        name        = payload.name,
        description = payload.description,
        sort_order  = payload.sort_order or 0,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    log_activity(
        db,
        "create_category",
        f"Created category: {cat.name} (slug: {cat.slug})",
        user=admin.username
    )

    return CategoryResponse(
        id            = cat.id,
        slug          = cat.slug,
        name          = cat.name,
        description   = cat.description,
        sort_order    = cat.sort_order,
        product_count = 0,
    )


# ── PUT update category (ADMIN) ───────────────────────────────
@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    payload:     CategoryUpdate,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    """
    Updates an existing category.
    Only fields included in the request body are updated.
    Admin only.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # If slug is being changed, check it's still unique
    if payload.slug and payload.slug != cat.slug:
        if db.query(Category).filter(Category.slug == payload.slug).first():
            raise HTTPException(
                status_code=400,
                detail=f"A category with slug '{payload.slug}' already exists"
            )

    # Apply only the fields that were actually sent
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)

    db.commit()
    db.refresh(cat)

    log_activity(
        db,
        "update_category",
        f"Updated category: {cat.name}",
        user=admin.username
    )

    count = db.query(Product).filter(Product.category_id == cat.id).count()

    return CategoryResponse(
        id            = cat.id,
        slug          = cat.slug,
        name          = cat.name,
        description   = cat.description,
        sort_order    = cat.sort_order,
        product_count = count,
    )


# ── DELETE category (ADMIN) ───────────────────────────────────
@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    """
    Deletes a category.
    Blocked if any products are still assigned to it —
    reassign or delete those products first.
    Admin only.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Safety check — don't orphan products
    product_count = db.query(Product).filter(
        Product.category_id == category_id
    ).count()

    if product_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot delete — {product_count} product(s) are assigned to "
                f"'{cat.name}'. Reassign or delete them first."
            )
        )

    log_activity(
        db,
        "delete_category",
        f"Deleted category: {cat.name} (id: {cat.id})",
        user=admin.username
    )

    db.delete(cat)
    db.commit()