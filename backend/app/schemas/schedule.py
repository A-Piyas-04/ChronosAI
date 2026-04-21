import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class ScheduleGenerateRequest(BaseModel):
    week_start_date: date
    generation_type: str = "initial"

    @field_validator("week_start_date")
    @classmethod
    def validate_monday(cls, value: date) -> date:
        if value.weekday() != 0:
            raise ValueError("week_start_date must be a Monday")
        return value


class ScheduleSessionResponse(BaseModel):
    id: uuid.UUID
    schedule_id: uuid.UUID
    task_id: uuid.UUID | None
    session_type: str
    title: str
    planned_start_at: datetime
    planned_end_at: datetime
    planned_duration_minutes: int
    status: str
    source: str
    position_index: int | None

    model_config = ConfigDict(from_attributes=True)


class ScheduleResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    week_start_date: date
    week_end_date: date
    generation_type: str
    status: str
    generated_at: datetime
    based_on_task_count: int | None
    based_on_event_count: int | None
    sessions: list[ScheduleSessionResponse]

    model_config = ConfigDict(from_attributes=True)
