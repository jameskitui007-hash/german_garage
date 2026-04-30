from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id          = Column(Integer, primary_key=True, autoincrement=True)

    # URL-safe identifier e.g. "engine-components", "braking-system"
    # Used in API filters: ?category_slug=braking-system
    slug        = Column(String(100), unique=True, index=True, nullable=False)

    # Human-readable display name e.g. "Engine Components"
    name        = Column(String(200), nullable=False)

    # Optional description shown in admin or shop UI
    description = Column(Text, nullable=True)

    # Controls display order in filter sidebar (lower = shown first)
    sort_order  = Column(Integer, default=0, nullable=False)

    # Reverse relationship — lets us do category.products
    # lazy="dynamic" means it doesn't load all products unless asked
    products    = relationship("Product", back_populates="category", lazy="dynamic")