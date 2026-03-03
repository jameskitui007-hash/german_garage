from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.customer import Customer
from app.dependencies import get_current_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# ── GET quick stats ───────────────────────────────────────────
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    today = datetime.utcnow().date()

    # Revenue — completed orders only
    total_revenue = db.query(func.sum(Order.total)).filter(
        Order.status == "delivered"
    ).scalar() or 0

    # Today's revenue
    today_revenue = db.query(func.sum(Order.total)).filter(
        Order.status == "delivered",
        func.date(Order.date) == today
    ).scalar() or 0

    # Orders
    total_orders   = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == "pending").count()

    # Products
    total_products = db.query(Product).count()
    low_stock      = db.query(Product).filter(
        Product.stock <= Product.min_stock,
        Product.stock > 0
    ).count()
    out_of_stock   = db.query(Product).filter(Product.stock == 0).count()

    # Customers
    total_customers = db.query(Customer).count()
    new_today       = db.query(Customer).filter(
        func.date(Customer.created_at) == today
    ).count()

    return {
        "revenue": {
            "total":   round(total_revenue, 2),
            "today":   round(today_revenue, 2),
        },
        "orders": {
            "total":   total_orders,
            "pending": pending_orders,
        },
        "products": {
            "total":        total_products,
            "low_stock":    low_stock,
            "out_of_stock": out_of_stock,
        },
        "customers": {
            "total":     total_customers,
            "new_today": new_today,
        }
    }


# ── GET last 7 days sales chart data ─────────────────────────
@router.get("/sales-chart")
def get_sales_chart(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    days   = []
    labels = []

    for i in range(6, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        revenue = db.query(func.sum(Order.total)).filter(
            func.date(Order.date) == date,
            Order.status == "delivered"
        ).scalar() or 0
        days.append(round(revenue, 2))
        labels.append(date.strftime("%d %b"))

    return {"labels": labels, "data": days}


# ── GET inventory by category chart data ─────────────────────
@router.get("/inventory-chart")
def get_inventory_chart(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    categories = ["brakes", "filters", "engine", "suspension", "electrical", "body"]
    data   = []
    labels = []

    for cat in categories:
        count = db.query(Product).filter(Product.category == cat).count()
        if count > 0:
            data.append(count)
            labels.append(cat.capitalize())

    return {"labels": labels, "data": data}


# ── GET recent orders (last 5) ────────────────────────────────
@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    orders = db.query(Order).order_by(Order.date.desc()).limit(5).all()

    return [
        {
            "order_number":   o.order_number,
            "customer_name":  o.customer_name or "Guest",
            "total":          o.total,
            "status":         o.status,
            "payment_status": o.payment_status,
            "date":           o.date,
            "items_count":    len(o.items)
        }
        for o in orders
    ]


# ── GET stock alerts (products below min stock) ───────────────
@router.get("/stock-alerts")
def get_stock_alerts(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    products = db.query(Product).filter(
        Product.stock <= Product.min_stock
    ).order_by(Product.stock.asc()).limit(10).all()

    return [
        {
            "id":        p.id,
            "sku":       p.sku,
            "name":      p.name,
            "brand":     p.brand,
            "stock":     p.stock,
            "min_stock": p.min_stock,
            "status":    "out_of_stock" if p.stock == 0 else "low_stock"
        }
        for p in products
    ]