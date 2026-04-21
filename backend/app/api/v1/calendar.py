from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.calendar import CalendarSyncResponse, ConnectedCalendarResponse
from app.services.calendar_service import list_connected_calendars, sync_primary_google_calendar

router = APIRouter()


@router.get("/connected", response_model=list[ConnectedCalendarResponse])
async def connected_calendars(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConnectedCalendarResponse]:
    calendars = await list_connected_calendars(db, current_user)
    return [ConnectedCalendarResponse.model_validate(calendar) for calendar in calendars]


@router.post("/sync", response_model=CalendarSyncResponse)
async def sync_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CalendarSyncResponse:
    calendar, events_synced, last_synced_at = await sync_primary_google_calendar(db, current_user)
    return CalendarSyncResponse(
        calendar_id=calendar.calendar_id,
        events_synced=events_synced,
        last_synced_at=last_synced_at,
    )
