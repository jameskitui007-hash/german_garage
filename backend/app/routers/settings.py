from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.settings import Setting
from app.schemas.settings import SettingResponse, SettingsUpdate
from app.dependencies import get_current_admin
from app.utils.logger import log_activity

router = APIRouter(prefix="/api/settings", tags=["Settings"])


# ── GET all settings (optionally filtered by group) ───────────
@router.get("", response_model=dict)
def get_settings(
    group: Optional[str] = Query(None),  # store | pricing | delivery | payment
    db:    Session = Depends(get_db),
    admin  = Depends(get_current_admin)
):
    q = db.query(Setting)
    if group:
        q = q.filter(Setting.group == group)

    settings = q.all()

    # Return as both a list and a flat key-value dict for easy frontend use
    return {
        "settings": [SettingResponse.from_orm(s) for s in settings],
        "values":   {s.key: s.value for s in settings}
    }


# ── PUT update settings ───────────────────────────────────────
@router.put("", response_model=dict)
def update_settings(
    payload: SettingsUpdate,
    db:      Session = Depends(get_db),
    admin    = Depends(get_current_admin)
):
    updated = []

    for key, value in payload.settings.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            setting.value = str(value)
            updated.append(key)
        # Silently ignore unknown keys

    db.commit()
    log_activity(db, "update_settings", f"Updated settings: {', '.join(updated)}", user=admin.username)

    return {"updated": updated, "message": "Settings saved successfully"}