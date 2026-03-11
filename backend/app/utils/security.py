from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY          = os.getenv("SECRET_KEY")
ALGORITHM           = os.getenv("ALGORITHM", "HS256")
EXPIRE_MINS         = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))   # was 480
REFRESH_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

# bcrypt context for hashing and verifying passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plain text password."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plain password against its hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived signed JWT access token (default 60 min)."""
    payload = data.copy()
    expire  = datetime.utcnow() + (expires_delta or timedelta(minutes=EXPIRE_MINS))
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token (default 7 days).
    Used by the frontend to obtain a new access token without re-login.
    """
    payload = data.copy()
    expire  = datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token. Returns None if invalid or wrong type."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Reject refresh tokens used as access tokens
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT refresh token. Returns None if invalid or wrong type."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None