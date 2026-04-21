from datetime import UTC, date, datetime, time, timedelta

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calendar_event import CalendarEvent
from app.models.connected_calendar import ConnectedCalendar
from app.models.user import User
from app.services.auth_service import get_google_access_token


def _parse_google_datetime(value: dict) -> tuple[datetime, bool]:
    datetime_value = value.get("dateTime")
    date_value = value.get("date")
    if datetime_value:
        parsed = datetime.fromisoformat(datetime_value.replace("Z", "+00:00"))
        return parsed.astimezone(UTC), False
    if date_value:
        parsed_date = date.fromisoformat(date_value)
        start = datetime.combine(parsed_date, time.min, tzinfo=UTC)
        return start, True
    raise ValueError("Unsupported Google Calendar date payload")


async def get_primary_calendar(db: AsyncSession, user: User) -> ConnectedCalendar:
    result = await db.execute(
        select(ConnectedCalendar).where(
            ConnectedCalendar.user_id == user.id,
            ConnectedCalendar.provider == "google",
            ConnectedCalendar.sync_enabled.is_(True),
            ConnectedCalendar.is_primary.is_(True),
        )
    )
    calendar = result.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No primary calendar connected")
    return calendar


async def list_connected_calendars(db: AsyncSession, user: User) -> list[ConnectedCalendar]:
    result = await db.execute(
        select(ConnectedCalendar).where(ConnectedCalendar.user_id == user.id).order_by(ConnectedCalendar.created_at)
    )
    return list(result.scalars().all())


async def sync_primary_google_calendar(db: AsyncSession, user: User) -> tuple[ConnectedCalendar, int, datetime]:
    calendar = await get_primary_calendar(db, user)
    access_token = await get_google_access_token(db, calendar)

    now = datetime.now(UTC)
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)

    params = {
        "timeMin": week_start.isoformat(),
        "timeMax": week_end.isoformat(),
        "singleEvents": "true",
        "orderBy": "startTime",
    }
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar.calendar_id}/events"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params, headers={"Authorization": f"Bearer {access_token}"})
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Google Calendar sync failed")

    payload = response.json()
    items = payload.get("items", [])
    synced_at = datetime.now(UTC)
    synced_count = 0

    for item in items:
        external_id = item.get("id")
        start_payload = item.get("start")
        end_payload = item.get("end")
        if not external_id or not start_payload or not end_payload:
            continue

        start_at, is_all_day = _parse_google_datetime(start_payload)
        end_at, _ = _parse_google_datetime(end_payload)
        result = await db.execute(
            select(CalendarEvent).where(
                CalendarEvent.connected_calendar_id == calendar.id,
                CalendarEvent.external_event_id == external_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            event = existing
        else:
            event = CalendarEvent(
                user_id=user.id,
                connected_calendar_id=calendar.id,
                external_event_id=external_id,
                title=item.get("summary") or "(No title)",
                start_at=start_at,
                end_at=end_at,
            )
            db.add(event)

        event.title = item.get("summary") or "(No title)"
        event.description = item.get("description")
        event.location = item.get("location")
        event.start_at = start_at
        event.end_at = end_at
        event.is_all_day = is_all_day
        event.is_recurring = bool(item.get("recurringEventId") or item.get("recurrence"))
        event.recurrence_rule = ",".join(item.get("recurrence", [])) if item.get("recurrence") else None
        event.is_busy = item.get("transparency") != "transparent"
        event.raw_payload = item
        event.last_synced_at = synced_at
        synced_count += 1

    calendar.last_synced_at = synced_at
    await db.commit()
    return calendar, synced_count, synced_at
