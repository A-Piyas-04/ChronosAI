from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.calendar import CalendarEventResponse, CalendarSyncResponse, ConnectedCalendarResponse
from app.services.calendar_sync import get_busy_events_for_week, get_connected_calendars, sync_calendar

router = APIRouter()


@router.get("/connected", response_model=list[ConnectedCalendarResponse])
async def connected_calendars(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConnectedCalendarResponse]:
    calendars = await get_connected_calendars(db, current_user.id)
    return [ConnectedCalendarResponse.model_validate(calendar) for calendar in calendars]


@router.post("/sync/{connected_calendar_id}", response_model=CalendarSyncResponse)
async def sync_calendar_route(
    connected_calendar_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CalendarSyncResponse:
    result = await sync_calendar(db, current_user.id, connected_calendar_id)
    return CalendarSyncResponse(
        calendar_id=result.calendar_id,
        events_synced=result.events_synced,
        last_synced_at=result.last_synced_at,
    )


@router.get("/events", response_model=list[CalendarEventResponse])
async def list_calendar_events(
    week_start: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CalendarEventResponse]:
    events = await get_busy_events_for_week(db, current_user.id, week_start)
    return [CalendarEventResponse.model_validate(event) for event in events]
