"""
routers/products.py
───────────────────
Product CRUD + full filter system.

Filter params for GET /api/products:
  search        — name, SKU, OEM number (partial match)
  brand         — mercedes | bmw
  category_id   — FK to categories table
  model_type    — e.g. E200, 320i, X5
  year          — single year compatibility check
  engine_type   — petrol | diesel
  min_price     — minimum selling price (KES)
  max_price     — maximum selling price (KES)
  stock_level   — low | out | good
  page          — pagination (default 1)
  per_page      — results per page (default 10, max 100)

All filters use AND logic.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime
from pathlib import Path
import uuid, csv, io

from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.category import CategoryResponse
from app.dependencies import get_current_admin
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/products", tags=["Products"])

# Directory where product images are stored
UPLOAD_DIR = Path("uploads/products")


# ── Helper: build ProductResponse with nested category ────────
def build_product_response(p: Product) -> ProductResponse:
    """
    Converts a Product ORM object into a ProductResponse.
    Includes the nested CategoryResponse if the category
    relationship is loaded — avoids N+1 queries when used
    with joinedload().
    """
    cat_response = None
    if p.category:
        cat_response = CategoryResponse(
            id          = p.category.id,
            slug        = p.category.slug,
            name        = p.category.name,
            description = p.category.description,
            sort_order  = p.category.sort_order,
        )

    return ProductResponse(
        id          = p.id,
        sku         = p.sku,
        name        = p.name,
        brand       = p.brand,
        category_id = p.category_id,
        category    = cat_response,
        type        = p.type,
        oem_number  = p.oem_number,
        price       = p.price,
        cost        = p.cost,
        stock       = p.stock,
        min_stock   = p.min_stock,
        description = p.description,
        supplier    = p.supplier,
        location    = p.location,
        model_type  = p.model_type,
        year_min    = p.year_min,
        year_max    = p.year_max,
        engine_type = p.engine_type,
        images      = p.images or [],   # ← ADD THIS
        created_at  = p.created_at,
        updated_at  = p.updated_at,
    )


# ── IMPORTANT: export/csv must come BEFORE /{product_id} ─────
# FastAPI matches routes top-to-bottom. If /{product_id} is
# defined first, "export" gets treated as a product_id string.

# ── GET export CSV ────────────────────────────────────────────
@router.get("/export/csv")
def export_products_csv(
    db:    Session = Depends(get_db),
    admin  = Depends(get_current_admin)
):
    """Export full inventory as CSV. Admin only."""
    products = db.query(Product).options(
        joinedload(Product.category)
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Updated headers to include new filter fields
    writer.writerow([
        "SKU", "Name", "Brand", "Category",
        "OEM Number", "Price", "Cost",
        "Stock", "Min Stock",
        "Model Type", "Year Min", "Year Max", "Engine Type",
        "Location", "Supplier"
    ])

    for p in products:
        writer.writerow([
            p.sku,
            p.name,
            p.brand,
            p.category.name if p.category else "",
            p.oem_number  or "",
            p.price,
            p.cost        or "",
            p.stock,
            p.min_stock,
            p.model_type  or "",
            p.year_min    or "",
            p.year_max    or "",
            p.engine_type or "",
            p.location    or "",
            p.supplier    or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory-export.csv"}
    )


# ── GET all products (with full filters + pagination) ─────────
@router.get("", response_model=dict)
def get_products(
    # Text search
    search:      Optional[str]   = Query(None, description="Search name, SKU, OEM number"),

    # Brand
    brand:       Optional[str]   = Query(None, description="mercedes | bmw"),

    # Category — accepts either category_id (int) or legacy
    # category slug string for backwards compatibility
    category_id: Optional[int]   = Query(None, description="Category ID from /api/categories"),

    # Vehicle compatibility
    model_type:  Optional[str]   = Query(None, description="e.g. E200, 320i, X5"),
    year:        Optional[int]   = Query(None, description="Find parts compatible with this year"),
    engine_type: Optional[str]   = Query(None, description="petrol | diesel"),

    # Price range
    min_price:   Optional[float] = Query(None, description="Minimum price (KES)"),
    max_price:   Optional[float] = Query(None, description="Maximum price (KES)"),

    # Stock level
    stock_level: Optional[str]   = Query(None, description="low | out | good"),

    # Pagination
    page:        int = Query(1, ge=1),
    per_page:    int = Query(10, ge=1, le=100),

    db: Session = Depends(get_db)
):
    """
    Returns paginated products with optional filters.
    All active filters are combined with AND logic.
    Category relationship is eagerly loaded to avoid N+1 queries.
    """
    # Eager load category relationship in a single JOIN
    q = db.query(Product).options(joinedload(Product.category))

    # ── Text search ───────────────────────────────────────────
    if search:
        term = f"%{search}%"
        q = q.filter(
            Product.name.ilike(term)       |
            Product.sku.ilike(term)        |
            Product.oem_number.ilike(term)
        )

    # ── Brand ─────────────────────────────────────────────────
    if brand:
        q = q.filter(Product.brand == brand.lower().strip())

    # ── Category (FK) ─────────────────────────────────────────
    if category_id:
        q = q.filter(Product.category_id == category_id)

    # ── Model type ────────────────────────────────────────────
    if model_type:
        # Partial match — "E35" will match "E350"
        q = q.filter(Product.model_type.ilike(f"%{model_type}%"))

    # ── Year compatibility ────────────────────────────────────
    # A part is compatible with a year if:
    #   - It has no year_min set   OR year_min <= requested year
    #   - AND no year_max set      OR year_max >= requested year
    # This means parts with NULL year fields match all years.
    if year:
        q = q.filter(
            (Product.year_min == None) | (Product.year_min <= year)
        ).filter(
            (Product.year_max == None) | (Product.year_max >= year)
        )

    # ── Engine type ───────────────────────────────────────────
    # NULL engine_type means the part fits both petrol and diesel
    if engine_type:
        q = q.filter(
            (Product.engine_type == None) |
            (Product.engine_type == engine_type.lower().strip())
        )

    # ── Price range ───────────────────────────────────────────
    if min_price is not None:
        q = q.filter(Product.price >= min_price)
    if max_price is not None:
        q = q.filter(Product.price <= max_price)

    # ── Stock level ───────────────────────────────────────────
    if stock_level == "out":
        q = q.filter(Product.stock == 0)
    elif stock_level == "low":
        q = q.filter(Product.stock > 0, Product.stock <= Product.min_stock)
    elif stock_level == "good":
        q = q.filter(Product.stock > Product.min_stock)

    # ── Paginate ──────────────────────────────────────────────
    total    = q.count()
    products = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":       total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "products":    [build_product_response(p) for p in products],
    }


# ── GET single product ────────────────────────────────────────
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Returns a single product by ID including nested category. Public."""
    p = db.query(Product).options(
        joinedload(Product.category)
    ).filter(Product.id == product_id).first()

    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    return build_product_response(p)


# ── POST create product ───────────────────────────────────────
@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    payload: ProductCreate,
    db:      Session = Depends(get_db),
    admin    = Depends(get_current_admin)
):
    """Creates a new product. Admin only."""

    # Check SKU uniqueness
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    # Verify the category exists
    category = db.query(Category).filter(
        Category.id == payload.category_id
    ).first()
    if not category:
        raise HTTPException(
            status_code=400,
            detail=f"Category with id {payload.category_id} not found"
        )

    # Validate year range makes sense
    if payload.year_min and payload.year_max:
        if payload.year_min > payload.year_max:
            raise HTTPException(
                status_code=400,
                detail="year_min cannot be greater than year_max"
            )

    product = Product(
        id          = f"prod_{uuid.uuid4().hex[:10]}",
        sku         = payload.sku,
        name        = payload.name,
        brand       = payload.brand,
        category_id = payload.category_id,
        type        = payload.type,
        oem_number  = payload.oem_number,
        price       = payload.price,
        cost        = payload.cost,
        stock       = payload.stock,
        min_stock   = payload.min_stock,
        description = payload.description,
        supplier    = payload.supplier,
        location    = payload.location,
        model_type  = payload.model_type,
        year_min    = payload.year_min,
        year_max    = payload.year_max,
        engine_type = payload.engine_type,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    # Reload with category eagerly loaded for the response
    product = db.query(Product).options(
        joinedload(Product.category)
    ).filter(Product.id == product.id).first()

    log_activity(
        db,
        "add_product",
        f"Added product: {product.name} ({product.sku})",
        user=admin.username
    )

    return build_product_response(product)


# ── PUT update product ────────────────────────────────────────
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload:    ProductUpdate,
    db:         Session = Depends(get_db),
    admin       = Depends(get_current_admin)
):
    """Updates a product. Only fields sent in body are changed. Admin only."""
    product = db.query(Product).options(
        joinedload(Product.category)
    ).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # If category is changing, verify the new one exists
    if payload.category_id is not None:
        category = db.query(Category).filter(
            Category.id == payload.category_id
        ).first()
        if not category:
            raise HTTPException(
                status_code=400,
                detail=f"Category with id {payload.category_id} not found"
            )

    # Apply only the fields that were sent
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, val)

    # Re-validate year range after applying updates
    if product.year_min and product.year_max:
        if product.year_min > product.year_max:
            raise HTTPException(
                status_code=400,
                detail="year_min cannot be greater than year_max"
            )

    product.updated_at = datetime.utcnow()
    db.commit()

    # Reload with category joined after commit
    product = db.query(Product).options(
        joinedload(Product.category)
    ).filter(Product.id == product_id).first()

    log_activity(
        db,
        "update_product",
        f"Updated product: {product.name} ({product.sku})",
        user=admin.username
    )

    return build_product_response(product)


# ── DELETE product ────────────────────────────────────────────
@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    db:         Session = Depends(get_db),
    admin       = Depends(get_current_admin)
):
    """
    Deletes a product and cleans up any associated images from disk.
    Admin only.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ── Clean up images from disk before deleting the record ──
    if product.images:
        for filename in product.images:
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception as e:
                    # Log but don't block the delete if file removal fails
                    print(f"Warning: could not delete image {filename}: {e}")

    name = product.name
    sku  = product.sku
    db.delete(product)
    db.commit()

    log_activity(
        db,
        "delete_product",
        f"Deleted product: {name} ({sku})",
        user=admin.username
    )