from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import csv, io

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.dependencies import get_current_admin
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def generate_order_number() -> str:
    """Generate order number like ORD-202401-001."""
    now = datetime.utcnow()
    return f"ORD-{now.strftime('%Y%m')}-{now.strftime('%d%H%M%S')}"


def upsert_customer(db: Session, name: str, phone: str, email: str, order_total: float):
    """Create or update customer record when an order is placed."""
    if not phone:
        return
    customer = db.query(Customer).filter(Customer.phone == phone).first()
    if customer:
        customer.total_orders += 1
        customer.total_spent  += order_total
        customer.last_order    = datetime.utcnow()
    else:
        import uuid
        customer = Customer(
            id=f"cust_{uuid.uuid4().hex[:10]}",
            name=name or "Guest",
            phone=phone,
            email=email,
            total_orders=1,
            total_spent=order_total,
            last_order=datetime.utcnow()
        )
        db.add(customer)
    db.commit()


# ── GET all orders ────────────────────────────────────────────
@router.get("", response_model=dict)
def get_orders(
    search:         Optional[str] = Query(None),
    status:         Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    date:           Optional[str] = Query(None),   # YYYY-MM-DD
    page:           int = Query(1, ge=1),
    per_page:       int = Query(10, ge=1, le=100),
    db:             Session = Depends(get_db),
    admin           = Depends(get_current_admin)
):
    q = db.query(Order)

    if search:
        q = q.filter(
            Order.order_number.ilike(f"%{search}%") |
            Order.customer_name.ilike(f"%{search}%") |
            Order.customer_phone.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Order.status == status)
    if payment_status:
        q = q.filter(Order.payment_status == payment_status)
    if date:
        q = q.filter(Order.date >= f"{date} 00:00:00", Order.date <= f"{date} 23:59:59")

    q = q.order_by(Order.date.desc())
    total    = q.count()
    orders   = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":       total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "orders":      [OrderResponse.from_orm(o) for o in orders]
    }


# ── GET single order ──────────────────────────────────────────
@router.get("/{order_number}", response_model=OrderResponse)
def get_order(order_number: str, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ── POST create order (public — from shop frontend) ───────────
@router.post("", response_model=OrderResponse, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Calculate total from items
    items_total = sum(item.price * item.quantity for item in payload.items)
    grand_total = items_total + payload.shipping_fee

    order = Order(
        order_number=generate_order_number(),
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        total=grand_total,
        shipping_fee=payload.shipping_fee,
        status="pending",
        payment_status=payload.payment_status,
        delivery_method=payload.delivery_method,
        delivery_address=payload.delivery_address,
        notes=payload.notes,
    )
    db.add(order)
    db.flush()  # Get order.id before committing

    # Add order items & deduct stock
    for item in payload.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            name=item.name,
            price=item.price,
            quantity=item.quantity
        ))
        # Deduct stock if product_id provided
        if item.product_id:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock = max(0, product.stock - item.quantity)

    db.commit()
    db.refresh(order)

    # Auto-create/update customer record
    upsert_customer(db, payload.customer_name, payload.customer_phone,
                    payload.customer_email, grand_total)

    return order


# ── PUT update order status ───────────────────────────────────
@router.put("/{order_number}", response_model=OrderResponse)
def update_order(
    order_number: str,
    payload:      OrderUpdate,
    db:           Session = Depends(get_db),
    admin         = Depends(get_current_admin)
):
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(order, field, val)

    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_activity(db, "update_order", f"Updated order {order_number} status to {order.status}", user=admin.username)
    return order


# ── DELETE order ──────────────────────────────────────────────
@router.delete("/{order_number}", status_code=204)
def delete_order(
    order_number: str,
    db:           Session = Depends(get_db),
    admin         = Depends(get_current_admin)
):
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
    log_activity(db, "delete_order", f"Deleted order: {order_number}", user=admin.username)


# ── GET export CSV ────────────────────────────────────────────
@router.get("/export/csv")
def export_orders_csv(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    orders = db.query(Order).order_by(Order.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Order Number", "Customer", "Phone", "Date",
                     "Items", "Total", "Status", "Payment Status", "Delivery"])
    for o in orders:
        writer.writerow([
            o.order_number, o.customer_name or "Guest",
            o.customer_phone or "", o.date.strftime("%Y-%m-%d") if o.date else "",
            len(o.items), o.total, o.status, o.payment_status, o.delivery_method
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders-export.csv"}
    )