import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PriorityType = Literal["low", "medium", "high", "urgent"]
TaskType = Literal["deep", "mechanical", "unspecified"]
ClassificationSource = Literal["manual", "ai", "rule"]
TaskStatus = Literal["inbox", "scheduled", "in_progress", "completed", "deferred", "cancelled"]
PreferredTimeOfDay = Literal["morning", "afternoon", "evening"]


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    estimated_minutes: int = Field(gt=0)
    deadline_at: datetime | None = None
    priority: PriorityType = "medium"
    task_type: TaskType = "unspecified"
    preferred_time_of_day: PreferredTimeOfDay | None = None
    earliest_start_at: datetime | None = None
    is_flexible: bool = True


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    estimated_minutes: int | None = Field(default=None, gt=0)
    deadline_at: datetime | None = None
    priority: PriorityType | None = None
    task_type: TaskType | None = None
    preferred_time_of_day: PreferredTimeOfDay | None = None
    earliest_start_at: datetime | None = None
    is_flexible: bool | None = None
    status: TaskStatus | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None
    estimated_minutes: int
    deadline_at: datetime | None
    priority: PriorityType
    task_type: TaskType
    classification_source: ClassificationSource
    status: TaskStatus
    is_flexible: bool
    preferred_time_of_day: PreferredTimeOfDay | None
    earliest_start_at: datetime | None
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
