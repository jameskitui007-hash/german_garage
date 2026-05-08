"""
One-time script to migrate existing local product images to Cloudinary.
Usage:
    cd backend
    python migrate_images_to_cloudinary.py
"""

import sys
import os
from pathlib import Path

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product
from app.utils.cloudinary import upload_image

UPLOAD_DIR = Path("uploads/products")


def migrate():
    db       = SessionLocal()
    migrated = 0
    skipped  = 0
    errors   = 0

    try:
        products = db.query(Product).filter(
            Product.images != None
        ).all()

        print(f"\n🔍 Found {len(products)} products with images\n")

        for product in products:
            images = product.images or []
            if not images:
                continue

            updated_images = []
            changed        = False

            for image in images:
                # Already migrated — skip
                if isinstance(image, dict) and "url" in image:
                    print(f"  ⏭️  {product.sku}: already migrated")
                    updated_images.append(image)
                    skipped += 1
                    continue

                # Old format — plain filename string
                if isinstance(image, str):
                    file_path = UPLOAD_DIR / image
                    if not file_path.exists():
                        print(f"  ⚠️  {product.sku}: file not found — {image}")
                        skipped += 1
                        continue

                    try:
                        file_bytes = file_path.read_bytes()
                        result     = upload_image(file_bytes)

                        updated_images.append({
                            "url":       result["url"],
                            "public_id": result["public_id"]
                        })

                        print(f"  ✅ {product.sku}: {image[:20]}... → Cloudinary")
                        migrated += 1
                        changed   = True

                    except Exception as e:
                        print(f"  ❌ {product.sku}: {image} — {e}")
                        updated_images.append(image)
                        errors += 1

            if changed:
                product.images = updated_images
                db.commit()

        print(f"\n✅ Done — migrated: {migrated}, skipped: {skipped}, errors: {errors}\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    print("\n☁️  Migrating images to Cloudinary...\n")
    migrate()
