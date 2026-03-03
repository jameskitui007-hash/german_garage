from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from typing import Optional


def log_activity(
    db: Session,
    action: str,
    details: Optional[str] = None,
    user: Optional[str] = None,
    ip: Optional[str] = None
):
    """Reusable activity logger — call this from any router."""
    entry = ActivityLog(
        action=action,
        details=details,
        user=user,
        ip=ip
    )
    db.add(entry)
    db.commit()