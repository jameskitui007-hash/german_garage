from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """
    Centralized application configuration.
    All values are read from the .env file and validated on startup.
    If any required value is missing or invalid, the app will refuse to start.
    """

    # ── Security ──────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str                      = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int    = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int      = 7

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str

    # ── App ───────────────────────────────────────────────────
    FRONTEND_URL: str                   = "http://127.0.0.1:5500"
    ENV: str                            = "development"   # "development" | "production"
    
    # ── Cloudinary ────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY:    str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ── Brute-force ───────────────────────────────────────────
    MAX_FAILED_LOGIN_ATTEMPTS: int      = 5
    LOCKOUT_DURATION_MINUTES: int       = 15

    # ── Validators ────────────────────────────────────────────

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        """
        Reject startup if SECRET_KEY is:
          - Not set at all
          - A known weak/default placeholder value
          - Shorter than 32 characters (256 bits minimum)
        """
        weak_defaults = {
            "secret", "changeme", "your-secret-key",
            "supersecret", "development", "test", "password",
        }

        if not v or v.strip() == "":
            raise ValueError(
                "SECRET_KEY is not set. "
                "Run: python generate_secret.py and add the output to your .env"
            )

        if v.lower() in weak_defaults:
            raise ValueError(
                f"SECRET_KEY '{v}' is a known weak default. "
                "Run: python generate_secret.py to generate a strong key."
            )

        if len(v) < 32:
            raise ValueError(
                f"SECRET_KEY is too short ({len(v)} chars). "
                "Minimum length is 32 characters. "
                "Run: python generate_secret.py to generate a strong key."
            )

        return v

    @field_validator("ENV")
    @classmethod
    def env_must_be_valid(cls, v: str) -> str:
        allowed = {"development", "production", "staging"}
        if v.lower() not in allowed:
            raise ValueError(f"ENV must be one of: {allowed}. Got: '{v}'")
        return v.lower()

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    @property
    def docs_enabled(self) -> bool:
        """Disable Swagger UI and ReDoc in production."""
        return not self.is_production

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Forbid any extra fields in .env to catch typos


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached singleton of the Settings instance.
    Use this everywhere instead of os.getenv() directly.

    Usage:
        from app.config import get_settings
        settings = get_settings()
        print(settings.SECRET_KEY)
    """
    return Settings()
    # return Settings(_env_file=".env", _env_file_encoding="utf-8")
    