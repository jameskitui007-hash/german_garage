from pydantic import BaseModel
from typing import Optional


class SettingResponse(BaseModel):
    id:    int
    key:   str
    value: Optional[str] = None
    group: Optional[str] = None

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    """Key-value pairs to update. Send only the keys you want to change."""
    settings: dict  # e.g. {"store_name": "New Name", "nairobi_fee": "600"}