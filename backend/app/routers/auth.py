from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.admin import Admin
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.security import verify_password, create_access_token
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Look up admin by username
    admin = db.query(Admin).filter(Admin.username == payload.username).first()

    # Validate credentials
    if not admin or not verify_password(payload.password, admin.hashed_password):
        # Log failed attempt
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

    # Create JWT token
    token = create_access_token({"sub": admin.username, "role": admin.role})

    # Log successful login
    log_activity(db, "login", f"Admin logged in: {admin.username}", user=admin.username)

    return TokenResponse(
        access_token=token,
        admin_name=admin.name,
        admin_role=admin.role
    )