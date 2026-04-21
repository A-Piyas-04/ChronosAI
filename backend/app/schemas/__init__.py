from app.schemas.auth import (
    GoogleAuthorizationResponse,
    GoogleCallbackRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.calendar import CalendarSyncResponse, ConnectedCalendarResponse
from app.schemas.schedule import ScheduleGenerateRequest, ScheduleResponse, ScheduleSessionResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.schemas.user import UserPreferencesResponse, UserPreferencesUpdate, UserResponse

__all__ = [
    "TokenResponse",
    "LoginRequest",
    "RegisterRequest",
    "GoogleCallbackRequest",
    "GoogleAuthorizationResponse",
    "UserResponse",
    "UserPreferencesResponse",
    "UserPreferencesUpdate",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "ScheduleGenerateRequest",
    "ScheduleSessionResponse",
    "ScheduleResponse",
    "ConnectedCalendarResponse",
    "CalendarSyncResponse",
]
