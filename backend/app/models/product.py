from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id          = Column(String(50), primary_key=True, index=True)
    sku         = Column(String(50), unique=True, index=True, nullable=False)
    name        = Column(String(200), nullable=False)
    brand       = Column(String(50), nullable=False, index=True)   # index added

    # ── Old text category — kept for safety during transition ─
    # Column("category") maps to the existing DB column name
    # We'll remove this after all products have a category_id assigned
    category_legacy = Column("category", String(50), nullable=True)

    # ── New FK category — links to categories table ───────────
    # nullable=True during migration; tighten to False after data migrated
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    # Gives us product.category_obj.name without extra queries
    category = relationship("Category", back_populates="products")

    type        = Column(String(50), default="genuine")    # genuine | oem | aftermarket
    oem_number  = Column(String(100), nullable=True)
    price       = Column(Float, nullable=False, index=True)  # index added
    cost        = Column(Float, nullable=True)
    stock       = Column(Integer, default=0)
    min_stock   = Column(Integer, default=5)
    description = Column(Text, nullable=True)
    supplier    = Column(String(200), nullable=True)
    location    = Column(String(100), nullable=True)
    images      = Column(JSON, nullable=True, default=list)

    # ── New filter columns ────────────────────────────────────
    # Earliest compatible year e.g. 2015
    year_min    = Column(Integer, nullable=True, index=True)

    # Latest compatible year e.g. 2022
    year_max    = Column(Integer, nullable=True, index=True)

    # "petrol" | "diesel" | None means fits both
    engine_type = Column(String(20), nullable=True, index=True)

    # Model variant e.g. "E200", "E350", "320i", "X5"
    model_type  = Column(String(100), nullable=True, index=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(),
                         onupdate=func.now())