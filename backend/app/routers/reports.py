from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import csv, io

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.dependencies import get_current_admin

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def filter_orders(db, start_date, end_date, brand):
    """Helper — apply date and brand filters to orders query."""
    q = db.query(Order)
    if start_date:
        q = q.filter(Order.date >= f"{start_date} 00:00:00")
    if end_date:
        q = q.filter(Order.date <= f"{end_date} 23:59:59")
    return q


# ── GET sales report ──────────────────────────────────────────
@router.get("")
def get_report(
    start_date: Optional[str] = Query(None),  # YYYY-MM-DD
    end_date:   Optional[str] = Query(None),
    brand:      Optional[str] = Query(None),
    type:       Optional[str] = Query("sales"),  # sales | inventory | customer
    db:         Session = Depends(get_db),
    admin       = Depends(get_current_admin)
):
    orders = filter_orders(db, start_date, end_date, brand).all()

    # Core metrics
    revenue     = sum(o.total for o in orders)
    order_count = len(orders)
    items_sold  = sum(len(o.items) for o in orders)
    avg_order   = revenue / order_count if order_count else 0

    # Sales by status
    by_status = {}
    for o in orders:
        by_status[o.status] = by_status.get(o.status, 0) + o.total

    # Top products by quantity sold
    top_products = (
        db.query(
            OrderItem.name,
            func.sum(OrderItem.quantity).label("qty"),
            func.sum(OrderItem.price * OrderItem.quantity).label("revenue")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .group_by(OrderItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(10)
        .all()
    )

    # Sales by brand (via product lookup)
    mercedes_rev = bmw_rev = 0
    for o in orders:
        for item in o.items:
            if item.product_id:
                p = db.query(Product).filter(Product.id == item.product_id).first()
                if p:
                    if p.brand == "mercedes":
                        mercedes_rev += item.price * item.quantity
                    elif p.brand == "bmw":
                        bmw_rev += item.price * item.quantity

    return {
        "summary": {
            "revenue":            round(revenue, 2),
            "orders":             order_count,
            "items_sold":         items_sold,
            "average_order_value": round(avg_order, 2),
        },
        "by_status":    by_status,
        "by_brand": {
            "mercedes": round(mercedes_rev, 2),
            "bmw":      round(bmw_rev, 2)
        },
        "top_products": [
            {"name": r.name, "qty": r.qty, "revenue": round(r.revenue, 2)}
            for r in top_products
        ]
    }


# ── GET export report CSV ─────────────────────────────────────
@router.get("/export/csv")
def export_report_csv(
    start_date: Optional[str] = Query(None),
    end_date:   Optional[str] = Query(None),
    db:         Session = Depends(get_db),
    admin       = Depends(get_current_admin)
):
    orders = filter_orders(db, start_date, end_date, None).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Order Number", "Date", "Customer", "Items",
                     "Total", "Status", "Payment"])
    for o in orders:
        writer.writerow([
            o.order_number,
            o.date.strftime("%Y-%m-%d") if o.date else "",
            o.customer_name or "Guest",
            len(o.items), o.total, o.status, o.payment_status
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=report-export.csv"}
    )