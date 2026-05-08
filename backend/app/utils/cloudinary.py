import cloudinary
import cloudinary.uploader
from app.config import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name = settings.CLOUDINARY_CLOUD_NAME,
    api_key    = settings.CLOUDINARY_API_KEY,
    api_secret = settings.CLOUDINARY_API_SECRET,
    secure     = True
)


def upload_image(file_bytes: bytes, folder: str = "german-garage/products") -> dict:
    result = cloudinary.uploader.upload(
        file_bytes,
        folder         = folder,
        transformation = [{"width": 800, "height": 800, "crop": "limit",
                           "quality": "auto", "fetch_format": "auto"}],
        resource_type  = "image"
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


def delete_image(public_id: str) -> bool:
    result = cloudinary.uploader.destroy(public_id)
    return result.get("result") == "ok"
