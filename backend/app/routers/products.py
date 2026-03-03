from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import uuid, csv, io

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.dependencies import get_current_admin
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/products", tags=["Products"])


# ── GET all products (with filters + pagination) ─────────────
@router.get("", response_model=dict)
def get_products(
    search:     Optional[str] = Query(None),
    brand:      Optional[str] = Query(None),
    category:   Optional[str] = Query(None),
    stock_level: Optional[str] = Query(None),  # low | out | good
    page:       int = Query(1, ge=1),
    per_page:   int = Query(10, ge=1, le=100),
    db:         Session = Depends(get_db)
):
    q = db.query(Product)

    # Apply filters
    if search:
        q = q.filter(
            Product.name.ilike(f"%{search}%") |
            Product.sku.ilike(f"%{search}%") |
            Product.oem_number.ilike(f"%{search}%")
        )
    if brand:
        q = q.filter(Product.brand == brand)
    if category:
        q = q.filter(Product.category == category)
    if stock_level == "out":
        q = q.filter(Product.stock == 0)
    elif stock_level == "low":
        q = q.filter(Product.stock > 0, Product.stock <= Product.min_stock)
    elif stock_level == "good":
        q = q.filter(Product.stock > Product.min_stock)

    total = q.count()
    products = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "products": [ProductResponse.from_orm(p) for p in products]
    }


# ── GET single product ────────────────────────────────────────
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ── POST create product ───────────────────────────────────────
@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    payload: ProductCreate,
    db:      Session = Depends(get_db),
    admin    = Depends(get_current_admin)
):
    # Check SKU is unique
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    product = Product(id=f"prod_{uuid.uuid4().hex[:10]}", **payload.dict())
    db.add(product)
    db.commit()
    db.refresh(product)

    log_activity(db, "add_product", f"Added product: {product.name} ({product.sku})", user=admin.username)
    return product


# ── PUT update product ────────────────────────────────────────
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload:    ProductUpdate,
    db:         Session = Depends(get_db),
    admin       = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Only update fields that were actually sent
    for field, val in payload.dict(exclude_unset=True).items():
        setattr(product, field, val)

    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)

    log_activity(db, "update_product", f"Updated product: {product.name}", user=admin.username)
    return product


# ── DELETE product ────────────────────────────────────────────
@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    db:         Session = Depends(get_db),
    admin       = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    name = product.name
    db.delete(product)
    db.commit()

    log_activity(db, "delete_product", f"Deleted product: {name}", user=admin.username)


# ── GET export CSV ────────────────────────────────────────────
@router.get("/export/csv")
def export_products_csv(
    db:    Session = Depends(get_db),
    admin  = Depends(get_current_admin)
):
    products = db.query(Product).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["SKU", "Name", "Brand", "Category", "OEM Number",
                     "Price", "Cost", "Stock", "Min Stock", "Location", "Supplier"])
    for p in products:
        writer.writerow([p.sku, p.name, p.brand, p.category, p.oem_number or "",
                         p.price, p.cost or "", p.stock, p.min_stock,
                         p.location or "", p.supplier or ""])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory-export.csv"}
    )