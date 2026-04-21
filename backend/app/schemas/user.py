import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    timezone: str
    auth_provider: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    work_days: list[int]
    work_start_time: time | None
    work_end_time: time | None
    productive_start_time: time | None
    productive_end_time: time | None
    deep_work_session_minutes: int
    short_break_minutes: int
    max_deep_work_sessions_per_day: int | None
    default_task_session_minutes: int
    allow_weekend_scheduling: bool
    role_type: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesUpdate(BaseModel):
    work_days: list[int] | None = None
    work_start_time: time | None = None
    work_end_time: time | None = None
    productive_start_time: time | None = None
    productive_end_time: time | None = None
    deep_work_session_minutes: int | None = None
    short_break_minutes: int | None = None
    max_deep_work_sessions_per_day: int | None = None
    default_task_session_minutes: int | None = None
    allow_weekend_scheduling: bool | None = None
    role_type: str | None = None
