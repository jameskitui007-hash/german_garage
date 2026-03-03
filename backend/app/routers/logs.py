from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.activity_log import ActivityLog
from app.dependencies import get_current_admin

router = APIRouter(prefix="/api/logs", tags=["Activity Logs"])


# ── GET all logs (paginated) ──────────────────────────────────
@router.get("", response_model=dict)
def get_logs(
    action:   Optional[str] = Query(None),  # filter by action type
    user:     Optional[str] = Query(None),  # filter by admin username
    page:     int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db:       Session = Depends(get_db),
    admin     = Depends(get_current_admin)
):
    q = db.query(ActivityLog)

    if action:
        q = q.filter(ActivityLog.action == action)
    if user:
        q = q.filter(ActivityLog.user == user)

    # Most recent first
    q = q.order_by(ActivityLog.timestamp.desc())

    total = q.count()
    logs  = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":       total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "logs": [
            {
                "id":        log.id,
                "action":    log.action,
                "details":   log.details,
                "user":      log.user,
                "ip":        log.ip,
                "timestamp": log.timestamp,
            }
            for log in logs
        ]
    }


# ── DELETE all logs (superadmin only) ────────────────────────
@router.delete("", status_code=204)
def clear_logs(
    db:    Session = Depends(get_db),
    admin  = Depends(get_current_admin)
):
    if admin.role != "superadmin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only superadmin can clear logs")

    db.query(ActivityLog).delete()
    db.commit()