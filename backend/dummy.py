"""
dummy.py — Populate database with sample data.
Usage:
    cd backend
    python dummy.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.customer import Customer
from app.models.supplier import Supplier
from datetime import datetime, timedelta
import random

db = SessionLocal()

# ── Products ─────────────────────────────────────────────────
print("📦 Seeding products...")
sample_products = [
    Product(id="prod_001", sku="MB-OF-001", name="Mercedes Oil Filter", brand="mercedes",
            category="filters", type="genuine", oem_number="A 642 180 02 00",
            price=5200, cost=3800, stock=15, min_stock=5,
            description="Genuine Mercedes-Benz oil filter. Fits C-Class, E-Class, S-Class 2015-2022.",
            supplier="Mercedes-Benz Kenya", location="Shelf A-1"),
    Product(id="prod_002", sku="MB-AF-001", name="Mercedes Air Filter", brand="mercedes",
            category="filters", type="genuine", oem_number="A 651 094 00 04",
            price=3800, cost=2600, stock=22, min_stock=5,
            description="Genuine Mercedes air filter. Improves engine performance.",
            supplier="Mercedes-Benz Kenya", location="Shelf A-2"),
    Product(id="prod_003", sku="BMW-OF-001", name="BMW Oil Filter Kit", brand="bmw",
            category="filters", type="genuine", oem_number="11 42 7 953 129",
            price=6800, cost=4900, stock=12, min_stock=5,
            description="Complete BMW oil filter kit with O-rings. Fits N20, B48 engines.",
            supplier="BMW East Africa", location="Shelf B-1"),
    Product(id="prod_004", sku="BMW-CF-001", name="BMW Cabin Filter", brand="bmw",
            category="filters", type="oem", oem_number="64 31 9 272 645",
            price=3200, cost=2100, stock=20, min_stock=5,
            description="Cabin air filter with activated carbon. Fits most BMW models.",
            supplier="BMW East Africa", location="Shelf B-2"),
    Product(id="prod_005", sku="MB-BP-001", name="Mercedes Brake Pads Front", brand="mercedes",
            category="brakes", type="oem", oem_number="A 007 420 69 20",
            price=8500, cost=5800, stock=10, min_stock=4,
            description="OEM front brake pads for Mercedes C-Class and E-Class.",
            supplier="Mercedes-Benz Kenya", location="Shelf A-3"),
    Product(id="prod_006", sku="MB-BD-001", name="Mercedes Brake Discs Front", brand="mercedes",
            category="brakes", type="oem", oem_number="A 213 421 01 12",
            price=18500, cost=13000, stock=4, min_stock=2,
            description="Front vented brake discs for Mercedes E-Class W213.",
            supplier="Mercedes-Benz Kenya", location="Shelf A-4"),
    Product(id="prod_007", sku="BMW-BP-001", name="BMW Brake Pads Set", brand="bmw",
            category="brakes", type="oem", oem_number="34 21 6 864 900",
            price=12500, cost=8700, stock=8, min_stock=4,
            description="OEM brake pads for BMW 3 Series, 5 Series. Front and rear set.",
            supplier="BMW East Africa", location="Shelf B-3"),
    Product(id="prod_008", sku="MB-SP-001", name="Mercedes Spark Plugs Set x4", brand="mercedes",
            category="engine", type="oem", oem_number="A 270 159 01 03",
            price=9800, cost=6800, stock=6, min_stock=3,
            description="Set of 4 iridium spark plugs for Mercedes 4-cylinder engines.",
            supplier="Mercedes-Benz Kenya", location="Shelf A-5"),
    Product(id="prod_009", sku="BMW-SP-001", name="BMW Spark Plugs Set x4", brand="bmw",
            category="engine", type="genuine", oem_number="12 12 0 037 244",
            price=11200, cost=7800, stock=8, min_stock=3,
            description="Genuine BMW iridium spark plugs for N20 and B48 engines.",
            supplier="BMW East Africa", location="Shelf B-4"),
    Product(id="prod_010", sku="MB-CA-001", name="Mercedes Control Arm Front", brand="mercedes",
            category="suspension", type="oem", oem_number="A 204 330 27 07",
            price=14200, cost=9800, stock=5, min_stock=2,
            description="Front lower control arm with bushings for Mercedes C-Class W204.",
            supplier="Mercedes-Benz Kenya", location="Shelf A-6"),
    Product(id="prod_011", sku="BMW-SS-001", name="BMW Suspension Strut Front", brand="bmw",
            category="suspension", type="aftermarket", oem_number="31 31 6 785 877",
            price=22500, cost=15500, stock=3, min_stock=2,
            description="Front gas-charged suspension strut for BMW 3 Series F30.",
            supplier="BMW East Africa", location="Shelf B-5"),
    Product(id="prod_012", sku="MB-BAT-001", name="Mercedes AGM Battery 80Ah", brand="mercedes",
            category="electrical", type="oem", oem_number="A 000 982 33 08",
            price=28500, cost=20000, stock=7, min_stock=3,
            description="AGM battery for Mercedes with Start-Stop system. 80Ah, 800A.",
            supplier="Mercedes-Benz Kenya", location="Shelf A-7"),
    Product(id="prod_013", sku="BMW-ALT-001", name="BMW Alternator 180A", brand="bmw",
            category="electrical", type="oem", oem_number="12 31 7 604 729",
            price=38500, cost=27000, stock=2, min_stock=2,
            description="Reconditioned alternator for BMW 5 Series F10. 12-month warranty.",
            supplier="BMW East Africa", location="Shelf B-6"),
]

for p in sample_products:
    exists = db.query(Product).filter(Product.id == p.id).first()
    if not exists:
        db.add(p)

db.commit()
print(f"✅ Products done.")

# ── Suppliers ─────────────────────────────────────────────────
print("🚚 Seeding suppliers...")
sample_suppliers = [
    Supplier(name="Mercedes-Benz Kenya", contact_person="John Mwangi",
             phone="+254712345671", email="parts@mercedes.co.ke",
             products_supplied="Genuine Mercedes parts", status="active"),
    Supplier(name="BMW East Africa", contact_person="Sarah Kariuki",
             phone="+254712345672", email="parts@bmw.co.ke",
             products_supplied="Genuine and OEM BMW parts", status="active"),
    Supplier(name="AutoParts Kenya", contact_person="James Odhiambo",
             phone="+254712345673", email="info@autoparts.co.ke",
             products_supplied="Aftermarket parts, filters, brakes", status="active"),
]

for s in sample_suppliers:
    exists = db.query(Supplier).filter(Supplier.name == s.name).first()
    if not exists:
        db.add(s)

db.commit()
print(f"✅ Suppliers done.")

# ── Orders ────────────────────────────────────────────────────
print("🛒 Seeding orders...")
customer_data = [
    {"name": "James Kamau",   "phone": "+254701111001", "email": "james@gmail.com"},
    {"name": "Grace Wanjiru", "phone": "+254701111002", "email": "grace@gmail.com"},
    {"name": "Brian Otieno",  "phone": "+254701111003", "email": "brian@gmail.com"},
    {"name": "Amina Hassan",  "phone": "+254701111004", "email": "amina@gmail.com"},
    {"name": "Peter Njoroge", "phone": "+254701111005", "email": "peter@gmail.com"},
]

all_products = db.query(Product).all()
statuses     = ["pending", "processing", "shipped", "delivered", "delivered", "delivered"]
payments     = ["paid", "paid", "paid", "pending_payment"]
deliveries   = ["pickup", "nairobi", "nairobi", "outside"]

order_count = 0
for i in range(20):
    customer   = random.choice(customer_data)
    prod_list  = random.sample(all_products, k=random.randint(1, 3))
    days_ago   = random.randint(0, 90)
    order_date = datetime.utcnow() - timedelta(days=days_ago)
    shipping   = random.choice([0, 500, 1500])
    total      = sum(p.price * random.randint(1, 2) for p in prod_list) + shipping
    order_num  = f"ORD-{order_date.strftime('%Y%m')}-{str(i+1).zfill(3)}"

    exists = db.query(Order).filter(Order.order_number == order_num).first()
    if exists:
        continue

    order = Order(
        order_number    = order_num,
        customer_name   = customer["name"],
        customer_phone  = customer["phone"],
        customer_email  = customer["email"],
        total           = total,
        shipping_fee    = shipping,
        status          = random.choice(statuses),
        payment_status  = random.choice(payments),
        delivery_method = random.choice(deliveries),
        date            = order_date,
    )
    for p in prod_list:
        order.items.append(OrderItem(
            product_id = p.id,
            name       = p.name,
            price      = p.price,
            quantity   = random.randint(1, 2),
        ))

    db.add(order)
    order_count += 1

db.commit()
print(f"✅ {order_count} orders done.")

# ── Customers ─────────────────────────────────────────────────
import uuid

print("\n👥 Seeding customers...")
for c in customer_data:
    exists = db.query(Customer).filter(Customer.phone == c["phone"]).first()
    if exists:
        continue
    cust_orders = db.query(Order).filter(Order.customer_phone == c["phone"]).all()
    total_spent = sum(o.total for o in cust_orders)
    last_order  = max((o.date for o in cust_orders), default=None)
    db.add(Customer(
        id           = "cust_" + str(uuid.uuid4())[:8],
        name         = c["name"],
        phone        = c["phone"],
        email        = c["email"],
        total_orders = len(cust_orders),
        total_spent  = total_spent,
        last_order   = last_order,
        is_vip       = total_spent > 50000,
    ))

db.commit()
print(f"✅ Customers done.")

db.close()
print("\n🎉 Dummy data loaded! Refresh your admin dashboard.")