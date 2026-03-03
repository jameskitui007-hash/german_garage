"""
Seed script — run once to populate initial data.
Usage: python seed.py
"""
from app.database import SessionLocal
from app.models.admin import Admin
from app.models.settings import Setting
from app.utils.security import hash_password
import uuid

db = SessionLocal()

# ── Seed Admin ──────────────────────────────────────────────
existing = db.query(Admin).filter(Admin.username == "admin").first()
if not existing:
    admin = Admin(
        id=str(uuid.uuid4()),
        username="admin",
        hashed_password=hash_password("MercedesBMW2024!"),
        name="System Administrator",
        role="superadmin",
        is_active=True
    )
    db.add(admin)
    print("✅ Admin user created — username: admin")
else:
    print("ℹ️  Admin user already exists, skipping.")

# ── Seed Default Settings ────────────────────────────────────
default_settings = [
    # Store
    {"key": "store_name",      "value": "Mercedes & BMW Parts Shop", "group": "store"},
    {"key": "contact_phone",   "value": "+254712345678",             "group": "store"},
    {"key": "contact_email",   "value": "info@mercedesbmwspecialist.co.ke", "group": "store"},
    {"key": "address",         "value": "Nairobi, Kenya",            "group": "store"},
    # Pricing
    {"key": "default_markup",  "value": "35",   "group": "pricing"},
    {"key": "min_profit",      "value": "1000", "group": "pricing"},
    {"key": "round_to",        "value": "50",   "group": "pricing"},
    # Delivery
    {"key": "nairobi_fee",     "value": "500",   "group": "delivery"},
    {"key": "outside_fee",     "value": "1500",  "group": "delivery"},
    {"key": "free_shipping",   "value": "15000", "group": "delivery"},
    # Payment
    {"key": "paybill",         "value": "123456",            "group": "payment"},
    {"key": "account_name",    "value": "MERCEDES BMW PARTS", "group": "payment"},
    {"key": "enable_mpesa",    "value": "true",  "group": "payment"},
    {"key": "enable_cash",     "value": "true",  "group": "payment"},
]

for s in default_settings:
    exists = db.query(Setting).filter(Setting.key == s["key"]).first()
    if not exists:
        db.add(Setting(**s))

db.commit()
print("✅ Default settings seeded.")
print("\n🚀 Seed complete!")
db.close()