from pydantic import BaseModel
from typing import Optional


# What the frontend sends to login
class LoginRequest(BaseModel):
    username: str
    password: str

# What the frontend sends to refresh
class RefreshRequest(BaseModel):
    refresh_token: str

# What we return after successful login
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    admin_name: str
    admin_role: str

# What we return from the /refresh endpoint
class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Data encoded inside the JWT token
class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None