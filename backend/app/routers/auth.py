from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.admin import Admin
from app.models.token_blocklist import TokenBlocklist
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse, AccessTokenResponse
from app.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    decode_access_token,
)
from app.utils.logger import log_activity
from app.dependencies import get_current_admin, oauth2_scheme

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Lock account for 15 minutes after this many consecutive failures
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION    = timedelta(minutes=15)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate admin and return access + refresh tokens.
    Locks the account for 15 minutes after 5 consecutive failed attempts.
    """

    # ── Step 1: Look up admin ─────────────────────────────────
    admin = db.query(Admin).filter(Admin.username == payload.username).first()

    # Use a generic error for both "user not found" and "wrong password"
    # to prevent username enumeration attacks
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )

    if not admin:
        log_activity(db, "failed_login", f"Login attempt for unknown username: {payload.username}")
        raise generic_error

    # ── Step 2: Check if account is currently locked ──────────
    now = datetime.utcnow()
    if admin.locked_until and admin.locked_until > now:
        remaining = int((admin.locked_until - now).total_seconds())
        log_activity(
            db, "blocked_login",
            f"Login blocked — account locked: {admin.username} ({remaining}s remaining)"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account locked due to too many failed attempts. Try again in {remaining} seconds."
        )

    # ── Step 3: Validate password ─────────────────────────────
    if not verify_password(payload.password, admin.hashed_password):
        admin.failed_login_count += 1

        if admin.failed_login_count >= MAX_FAILED_ATTEMPTS:
            # Lock the account
            admin.locked_until = now + LOCKOUT_DURATION
            db.commit()
            log_activity(
                db, "account_locked",
                f"Account locked after {MAX_FAILED_ATTEMPTS} failed attempts: {admin.username}"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked for {int(LOCKOUT_DURATION.total_seconds() // 60)} minutes due to too many failed attempts."
            )

        # Not locked yet — tell the user how many attempts remain
        attempts_left = MAX_FAILED_ATTEMPTS - admin.failed_login_count
        db.commit()
        log_activity(db, "failed_login", f"Failed login attempt: {admin.username} ({attempts_left} attempts left)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid username or password. {attempts_left} attempt(s) remaining before lockout."
        )

    # ── Step 4: Check account is active ──────────────────────
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled"
        )

    # ── Step 5: Successful login — reset failure counters ─────
    admin.failed_login_count = 0
    admin.locked_until       = None
    db.commit()

    # ── Step 6: Issue tokens ──────────────────────────────────
    access_token  = create_access_token({"sub": admin.username, "role": admin.role})
    refresh_token = create_refresh_token({"sub": admin.username})

    log_activity(db, "login", f"Admin logged in: {admin.username}", user=admin.username)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        admin_name=admin.name,
        admin_role=admin.role
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token: str = Depends(oauth2_scheme),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Invalidate the current access token by adding its jti to the blocklist.
    Even if someone has a copy of the token, it will be rejected from this point on.
    """
    payload = decode_access_token(token)
    if payload and payload.get("jti"):
        revoked = TokenBlocklist(
            jti=payload["jti"],
            username=current_admin.username
        )
        db.add(revoked)
        db.commit()

    log_activity(db, "logout", f"Admin logged out: {current_admin.username}", user=current_admin.username)


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