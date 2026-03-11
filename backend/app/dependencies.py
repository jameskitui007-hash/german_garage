from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.admin import Admin
from app.models.token_blocklist import TokenBlocklist
from app.utils.security import decode_access_token

# Tells FastAPI where to find the token (Authorization header)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Admin:
    """
    JWT guard — protects any route that requires admin login.
    Rejects tokens that:
      - Cannot be decoded / are expired
      - Have a jti that has been revoked (i.e. the admin logged out)
      - Belong to a non-existent or disabled admin
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Step 1 — decode and validate signature + expiry
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Step 2 — check jti against the blocklist (logout revocation)
    jti = payload.get("jti")
    if jti is None:
        raise credentials_exception

    is_revoked = db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first()
    if is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3 — confirm admin still exists and is active
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception

    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None or not admin.is_active:
        raise credentials_exception

    return admin