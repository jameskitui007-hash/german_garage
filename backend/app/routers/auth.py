from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.admin import Admin
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse, AccessTokenResponse
from app.utils.security import verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Look up admin by username
    admin = db.query(Admin).filter(Admin.username == payload.username).first()

    # Validate credentials
    if not admin or not verify_password(payload.password, admin.hashed_password):
        log_activity(db, "failed_login", f"Failed login attempt: {payload.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled"
        )

    # Issue both tokens
    access_token  = create_access_token({"sub": admin.username, "role": admin.role})
    refresh_token = create_refresh_token({"sub": admin.username})

    log_activity(db, "login", f"Admin logged in: {admin.username}", user=admin.username)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        admin_name=admin.name,
        admin_role=admin.role
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new short-lived access token."""
    data = decode_refresh_token(payload.refresh_token)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    admin = db.query(Admin).filter(Admin.username == data["sub"]).first()
    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found or disabled"
        )

    new_access_token = create_access_token({"sub": admin.username, "role": admin.role})
    return AccessTokenResponse(access_token=new_access_token)