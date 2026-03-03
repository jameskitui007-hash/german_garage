from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import csv, io

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerUpdate, CustomerResponse
from app.dependencies import get_current_admin
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/customers", tags=["Customers"])


# ── GET all customers ─────────────────────────────────────────
@router.get("", response_model=dict)
def get_customers(
    search:   Optional[str] = Query(None),
    type:     Optional[str] = Query(None),  # vip | regular
    page:     int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db:       Session = Depends(get_db),
    admin     = Depends(get_current_admin)
):
    q = db.query(Customer)

    if search:
        q = q.filter(
            Customer.name.ilike(f"%{search}%") |
            Customer.phone.ilike(f"%{search}%") |
            Customer.email.ilike(f"%{search}%")
        )
    if type == "vip":
        q = q.filter(Customer.is_vip == True)
    elif type == "regular":
        q = q.filter(Customer.is_vip == False)

    total     = q.count()
    customers = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":       total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "customers":   [CustomerResponse.from_orm(c) for c in customers]
    }


# ── GET single customer + order history ───────────────────────
@router.get("/{customer_id}", response_model=dict)
def get_customer(
    customer_id: str,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Fetch order history by phone
    orders = []
    if customer.phone:
        orders = db.query(Order).filter(
            Order.customer_phone == customer.phone
        ).order_by(Order.date.desc()).all()

    return {
        "customer": CustomerResponse.from_orm(customer),
        "orders": [
            {
                "order_number":   o.order_number,
                "date":           o.date,
                "total":          o.total,
                "status":         o.status,
                "payment_status": o.payment_status,
                "items_count":    len(o.items)
            }
            for o in orders
        ]
    }


# ── PUT update customer ───────────────────────────────────────
@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    payload:     CustomerUpdate,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(customer, field, val)

    customer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(customer)

    log_activity(db, "update_customer", f"Updated customer: {customer.name}", user=admin.username)
    return customer


# ── DELETE customer ───────────────────────────────────────────
@router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: str,
    db:          Session = Depends(get_db),
    admin        = Depends(get_current_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    log_activity(db, "delete_customer", f"Deleted customer: {customer.name}", user=admin.username)
    db.delete(customer)
    db.commit()


# ── GET export CSV ────────────────────────────────────────────
@router.get("/export/csv")
def export_customers_csv(
    db:    Session = Depends(get_db),
    admin  = Depends(get_current_admin)
):
    customers = db.query(Customer).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Phone", "Email",
                     "Total Orders", "Total Spent", "VIP", "Last Order"])
    for c in customers:
        writer.writerow([
            c.id, c.name, c.phone or "", c.email or "",
            c.total_orders, c.total_spent, c.is_vip,
            c.last_order.strftime("%Y-%m-%d") if c.last_order else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers-export.csv"}
    )