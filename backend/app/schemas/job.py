from typing import Any

from pydantic import BaseModel


class JobQueuedResponse(BaseModel):
    task_id: str
    status: str = "queued"
    message: str


class JobStatusResponse(BaseModel):
    task_id: str
    status: str
    result: dict[str, Any] | None
    error: str | None
