import uuid
import os
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from sqlalchemy.orm import Session
from PIL import Image
import io

from app.database import get_db
from app.models.product import Product
from app.dependencies import get_current_admin
from app.utils.logger import log_activity
from app.utils.cloudinary import upload_image, delete_image

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

# ── Constants ─────────────────────────────────────────────────
UPLOAD_DIR      = Path("uploads/products")
ALLOWED_TYPES   = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_EXTS    = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE   = 5 * 1024 * 1024   # 5MB in bytes
MAX_DIMENSION   = 800                # max width or height in pixels
MAX_IMAGES      = 6                  # max images per product


def get_image_url(filename: str, request_base: str = "http://127.0.0.1:8000") -> str:
    """Build the full public URL for an image filename."""
    return f"{request_base}/uploads/products/{filename}"


# ── POST upload image for a product ──────────────────────────
@router.post("/product/{product_id}", status_code=201)
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    Upload a single image for a product.
    - Validates file type and size
    - Resizes to max 800x800px while keeping aspect ratio
    - Saves to uploads/products/ with a unique filename
    - Appends filename to product.images in the DB
    """

    # ── Step 1: Find the product ──────────────────────────────
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ── Step 2: Check image limit ─────────────────────────────
    current_images = product.images or []
    if len(current_images) >= MAX_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_IMAGES} images allowed per product"
        )

    # ── Step 3: Validate file type ────────────────────────────
    # Check MIME type reported by browser
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: jpg, png, webp"
        )

    # Also check the file extension for extra safety
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed: .jpg, .png, .webp"
        )

    # ── Step 4: Read file and check size ──────────────────────
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(contents) // 1024}KB). Maximum size is 5MB"
        )

    # ── Step 5: Process image with Pillow ─────────────────────
    try:
        image = Image.open(io.BytesIO(contents))

        # Convert RGBA/P mode images to RGB (needed for JPEG saving)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            ext = ".jpg"  # force jpg for converted images

        # Resize if larger than MAX_DIMENSION, keeping aspect ratio
        if image.width > MAX_DIMENSION or image.height > MAX_DIMENSION:
            image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file"
        )

    # Step 6: Upload to Cloudinary
    try:
        upload_buffer = io.BytesIO()

        save_format = "JPEG" if ext in (".jpg", ".jpeg") else image.format
        image.save(upload_buffer, format=save_format, optimize=True, quality=85)

        upload_buffer.seek(0)
        result = upload_image(upload_buffer.getvalue())

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )

    # Step 7: Update product images array in DB
    image_record = {
        "url": result["url"],
        "public_id": result["public_id"],
    }

    updated_images = list(current_images) + [image_record]
    product.images = updated_images

    db.commit()
    db.refresh(product)

    log_activity(
        db,
        "upload_image",
        f"Uploaded image {result['public_id']} for product: {product.name}",    
        user=admin.username
    )

    return {
        "filename": result["public_id"],
        "url": result["url"],
        "public_id": result["public_id"],
        "images": product.images,
        "message": "Image uploaded successfully"
    }



# ── DELETE remove a single image from a product ───────────────
@router.delete("/product/{product_id}/{image_index}", status_code=200)
def delete_product_image(
    product_id: str,
    image_index: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    current_images = product.images or []

    if image_index < 0 or image_index >= len(current_images):
        raise HTTPException(status_code=404, detail="Image not found on this product")

    image_to_delete = current_images[image_index]

    if isinstance(image_to_delete, dict):
        public_id = image_to_delete.get("public_id")
        if public_id:
            delete_image(public_id)
    else:
        file_path = UPLOAD_DIR / image_to_delete
        if file_path.exists():
            file_path.unlink()

    product.images = [
        img for i, img in enumerate(current_images)
        if i != image_index
    ]

    db.commit()

    return {
        "message": "Image deleted successfully",
        "images": product.images
    }
