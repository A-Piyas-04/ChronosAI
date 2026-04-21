import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ConnectedCalendarResponse(BaseModel):
    id: uuid.UUID
    provider: str
    calendar_id: str
    calendar_name: str | None
    is_primary: bool
    sync_enabled: bool
    last_synced_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CalendarSyncResponse(BaseModel):
    calendar_id: str
    events_synced: int
    last_synced_at: datetime


class CalendarEventResponse(BaseModel):
    id: uuid.UUID
    title: str
    start_at: datetime
    end_at: datetime
    is_all_day: bool

    model_config = ConfigDict(from_attributes=True)
