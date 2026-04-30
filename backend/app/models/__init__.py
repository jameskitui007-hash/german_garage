from app.models.category import Category          # ← Category FIRST

from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.admin import Admin
from app.models.activity_log import ActivityLog
from app.models.settings import Setting
from app.models.token_blocklist import TokenBlocklist