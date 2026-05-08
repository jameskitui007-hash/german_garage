"""
routers/shop.py
───────────────
Public-facing shop endpoints. No authentication required.

Key differences from /api/products (admin):
  - Only returns products with stock > 0
  - Hides sensitive fields: cost, location, supplier
  - Includes cascading filter support for the shop UI
  - Includes /api/shop/categories for the filter sidebar
  - Includes /api/shop/filters for dynamic filter options
    (returns only brands/models/years that have actual products)

Endpoints:
  GET /api/shop/products              — filtered product listing
  GET /api/shop/products/{id}         — single product detail
  GET /api/shop/categories            — all categories with product counts
  GET /api/shop/filters               — dynamic filter options
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import distinct
from typing import Any,Optional, List
from pydantic import BaseModel

from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/api/shop", tags=["Shop"])


# ── Public product response schema ────────────────────────────
# Separate from ProductResponse — hides cost, location, supplier
class ShopProductResponse(BaseModel):
    """
    Public-safe product schema.
    Deliberately excludes: cost, location, supplier.
    These are internal/admin-only fields.
    """
    id:          str
    sku:         str
    name:        str
    brand:       str
    category_id: Optional[int]          = None
    category:    Optional[CategoryResponse] = None
    type:        Optional[str]          = None
    oem_number:  Optional[str]          = None
    price:       float
    stock:       int
    min_stock:   int
    images:      Optional[list[Any]] = None  # ← ADD THIS
    description: Optional[str]         = None
    model_type:  Optional[str]         = None
    year_min:    Optional[int]         = None
    year_max:    Optional[int]         = None
    engine_type: Optional[str]         = None

    class Config:
        from_attributes = True


def build_shop_response(p: Product) -> ShopProductResponse:
    """
    Converts a Product ORM object to a ShopProductResponse.
    Strips sensitive fields (cost, location, supplier).
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

    return ShopProductResponse(
        id          = p.id,
        sku         = p.sku,
        name        = p.name,
        brand       = p.brand,
        category_id = p.category_id,
        category    = cat_response,
        type        = p.type,
        oem_number  = p.oem_number,
        price       = p.price,
        stock       = p.stock,
        min_stock   = p.min_stock,
        description = p.description,
        model_type  = p.model_type,
        year_min    = p.year_min,
        year_max    = p.year_max,
        engine_type = p.engine_type,
        images      = p.images or [],  # ← ADD THIS

    )


# ── GET /api/shop/categories ──────────────────────────────────
@router.get("/categories", response_model=list[CategoryResponse])
def get_shop_categories(db: Session = Depends(get_db)):
    """
    Returns all categories that have at least one in-stock product.
    Used to populate the shop filter sidebar.
    Public — no auth required.
    """
    # Get category IDs that have at least one in-stock product
    active_category_ids = (
        db.query(distinct(Product.category_id))
        .filter(
            Product.category_id != None,
            Product.stock > 0
        )
        .all()
    )

    # Flatten the list of tuples from SQLAlchemy
    active_ids = [row[0] for row in active_category_ids]

    if not active_ids:
        return []

    categories = (
        db.query(Category)
        .filter(Category.id.in_(active_ids))
        .order_by(Category.sort_order)
        .all()
    )

    result = []
    for cat in categories:
        # Count only in-stock products
        count = db.query(Product).filter(
            Product.category_id == cat.id,
            Product.stock > 0
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


# ── GET /api/shop/filters ─────────────────────────────────────
@router.get("/filters")
def get_shop_filters(
    brand:       Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns dynamic filter options based on what products actually exist.
    This powers the cascading filter UI:

      Step 1: No filters     → returns available brands
      Step 2: Brand selected → returns models for that brand
      Step 3: Model selected → returns years for that brand+model

    Only includes values from in-stock products.
    Public — no auth required.
    """
    # Base query — only in-stock products
    q = db.query(Product).filter(Product.stock > 0)

    # Apply brand filter if provided (for cascading)
    if brand:
        q = q.filter(Product.brand == brand.lower())

    # Apply category filter if provided
    if category_id:
        q = q.filter(Product.category_id == category_id)

    # ── Available brands ──────────────────────────────────────
    brands = (
        db.query(distinct(Product.brand))
        .filter(Product.stock > 0)
        .all()
    )
    available_brands = sorted([r[0] for r in brands if r[0]])

    # ── Available models (filtered by brand if selected) ──────
    models_q = db.query(distinct(Product.model_type)).filter(
        Product.stock > 0,
        Product.model_type != None
    )
    if brand:
        models_q = models_q.filter(Product.brand == brand.lower())
    models = models_q.all()
    available_models = sorted([r[0] for r in models if r[0]])

    # ── Available years (filtered by brand if selected) ───────
    # Collect all year_min and year_max values and build a range
    year_q = q.filter(
        Product.year_min != None,
        Product.year_max != None
    )
    year_rows = year_q.with_entities(
        Product.year_min,
        Product.year_max
    ).all()

    # Build the full set of years covered by all parts
    all_years = set()
    for year_min, year_max in year_rows:
        if year_min and year_max:
            for y in range(year_min, year_max + 1):
                all_years.add(y)

    available_years = sorted(list(all_years))

    # ── Available engine types ─────────────────────────────────
    engine_q = db.query(distinct(Product.engine_type)).filter(
        Product.stock > 0,
        Product.engine_type != None
    )
    if brand:
        engine_q = engine_q.filter(Product.brand == brand.lower())
    engines = engine_q.all()
    available_engine_types = sorted([r[0] for r in engines if r[0]])

    # ── Price range ────────────────────────────────────────────
    from sqlalchemy import func
    price_data = db.query(
        func.min(Product.price),
        func.max(Product.price)
    ).filter(Product.stock > 0).first()

    return {
        "brands":       available_brands,
        "models":       available_models,
        "years":        available_years,
        "engine_types": available_engine_types,
        "price_range": {
            "min": float(price_data[0]) if price_data[0] else 0,
            "max": float(price_data[1]) if price_data[1] else 0,
        },
    }


# ── GET /api/shop/products ────────────────────────────────────
@router.get("/products", response_model=dict)
def get_shop_products(
    # Text search
    search:      Optional[str]   = Query(None, description="Search by name, SKU, OEM number"),

    # Brand
    brand:       Optional[str]   = Query(None, description="mercedes | bmw"),

    # Category
    category_id: Optional[int]   = Query(None, description="Category ID from /api/shop/categories"),

    # Vehicle compatibility
    model_type:  Optional[str]   = Query(None, description="e.g. E200, 320i, X5"),
    year:        Optional[int]   = Query(None, description="Find parts compatible with this year"),
    engine_type: Optional[str]   = Query(None, description="petrol | diesel"),

    # Price range
    min_price:   Optional[float] = Query(None, description="Minimum price (KES)"),
    max_price:   Optional[float] = Query(None, description="Maximum price (KES)"),

    # Sort
    sort_by:     Optional[str]   = Query(
        "featured",
        description="featured | price_asc | price_desc | newest"
    ),

    # Pagination
    page:        int = Query(1, ge=1),
    per_page:    int = Query(12, ge=1, le=100),

    db: Session = Depends(get_db)
):
    """
    Public product listing for the shop frontend.
    Only returns in-stock products (stock > 0).
    All filters use AND logic.
    """
    # Base query — public shop only shows in-stock products
    q = db.query(Product).options(
        joinedload(Product.category)
    ).filter(Product.stock > 0)

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

    # ── Category ──────────────────────────────────────────────
    if category_id:
        q = q.filter(Product.category_id == category_id)

    # ── Model type ────────────────────────────────────────────
    if model_type:
        q = q.filter(Product.model_type.ilike(f"%{model_type}%"))

    # ── Year compatibility ────────────────────────────────────
    # NULL year fields = fits all years
    if year:
        q = q.filter(
            (Product.year_min == None) | (Product.year_min <= year)
        ).filter(
            (Product.year_max == None) | (Product.year_max >= year)
        )

    # ── Engine type ───────────────────────────────────────────
    # NULL engine_type = fits both petrol and diesel
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

    # ── Sorting ───────────────────────────────────────────────
    if sort_by == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        q = q.order_by(Product.price.desc())
    elif sort_by == "newest":
        q = q.order_by(Product.created_at.desc())
    else:
        # "featured" — show lowest stock first to create urgency
        # then by name alphabetically
        q = q.order_by(Product.stock.asc(), Product.name.asc())

    # ── Paginate ──────────────────────────────────────────────
    total    = q.count()
    products = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":       total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "products":    [build_shop_response(p) for p in products],
    }


# ── GET /api/shop/products/{id} ───────────────────────────────
@router.get("/products/{product_id}", response_model=ShopProductResponse)
def get_shop_product(
    product_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns a single product by ID.
    Returns 404 if the product is out of stock —
    customers should not be able to view unavailable items.
    Public — no auth required.
    """
    p = db.query(Product).options(
        joinedload(Product.category)
    ).filter(
        Product.id == product_id,
        Product.stock > 0          # hide out-of-stock from shop
    ).first()

    if not p:
        raise HTTPException(
            status_code=404,
            detail="Product not found or currently unavailable"
        )

    return build_shop_response(p)