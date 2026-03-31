import re
from pydantic import BaseModel, field_validator
from typing import Optional


# What the frontend sends to login
class LoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        if len(v) > 50:
            raise ValueError("Username must be 50 characters or fewer")
        # Only allow alphanumeric + underscore — blocks injection attempts
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username may only contain letters, numbers, and underscores")
        return v

    @field_validator("password")
    @classmethod
    def password_must_be_valid(cls, v: str) -> str:
        if not v:
            raise ValueError("Password cannot be empty")
        if len(v) > 128:
            raise ValueError("Password must be 128 characters or fewer")
        return v


# What the frontend sends to refresh
class RefreshRequest(BaseModel):
    refresh_token: str

    @field_validator("refresh_token")
    @classmethod
    def token_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Refresh token cannot be empty")
        return v.strip()


# What we return after successful login
class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    admin_name:    str
    admin_role:    str


# What we return from the /refresh endpoint
class AccessTokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"

# What we return from the /refresh endpoint
class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Data encoded inside the JWT token
class TokenData(BaseModel):
    username: Optional[str] = None
    role:     Optional[str] = None