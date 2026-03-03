from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.dependencies import get_current_admin
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


# ── GET all suppliers ─────────────────────────────────────────
@router.get("", response_model=dict)
def get_suppliers(
    search:   Optional[str] = Query(None),
    status:   Optional[str] = Query(None),  # active | inactive
    page:     int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db:       Session = Depends(get_db),
    admin     = Depends(get_current_admin)
):
    q = db.query(Supplier)

    if search:
        q = q.filter(
            Supplier.name.ilike(f"%{search}%") |
            Supplier.contact_person.ilike(f"%{search}%") |
            Supplier.email.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Supplier.status == status)

    total     = q.count()
    suppliers = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":       total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "suppliers":   [SupplierResponse.from_orm(s) for s in suppliers]
    }


# ── GET single supplier ───────────────────────────────────────
@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


# ── POST create supplier ──────────────────────────────────────
@router.post("", response_model=SupplierResponse, status_code=201)
def create_supplier(
    payload: SupplierCreate,
    db:      Session = Depends(get_db),
    admin    = Depends(get_current_admin)
):
    supplier = Supplier(**payload.dict())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    log_activity(db, "add_supplier", f"Added supplier: {supplier.name}", user=admin.username)
    return supplier


# ── PUT update supplier ───────────────────────────────────────
@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    payload:     SupplierUpdate,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(supplier, field, val)

    supplier.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(supplier)

    log_activity(db, "update_supplier", f"Updated supplier: {supplier.name}", user=admin.username)
    return supplier


# ── DELETE supplier ───────────────────────────────────────────
@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    log_activity(db, "delete_supplier", f"Deleted supplier: {supplier.name}", user=admin.username)
    db.delete(supplier)
    db.commit()