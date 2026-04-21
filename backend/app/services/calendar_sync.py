from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decrypt_token, encrypt_token
from app.models.calendar_event import CalendarEvent
from app.models.connected_calendar import ConnectedCalendar


@dataclass
class CalendarSyncResult:
    calendar_id: str
    events_synced: int
    last_synced_at: datetime


def _to_utc_datetime(payload: dict) -> tuple[datetime, bool]:
    date_time_value = payload.get("dateTime")
    date_value = payload.get("date")
    if date_time_value:
        parsed = datetime.fromisoformat(date_time_value.replace("Z", "+00:00"))
        return parsed.astimezone(UTC), False
    if date_value:
        parsed_date = date.fromisoformat(date_value)
        return datetime.combine(parsed_date, time.min, tzinfo=UTC), True
    raise ValueError("Unsupported Google event datetime format")


def _build_google_credentials(calendar: ConnectedCalendar) -> Credentials:
    from google.oauth2.credentials import Credentials

    if not calendar.access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Calendar access token missing")

    access_token = decrypt_token(calendar.access_token)
    refresh_token = decrypt_token(calendar.refresh_token) if calendar.refresh_token else None
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/calendar.readonly"],
    )


def _refresh_google_credentials(credentials: Credentials) -> None:
    from google.auth.transport.requests import Request

    credentials.refresh(Request())


def _fetch_events(credentials: Credentials, calendar_id: str, time_min: str, time_max: str) -> list[dict]:
    from googleapiclient.discovery import build

    service = build("calendar", "v3", credentials=credentials, cache_discovery=False)
    response = (
        service.events()
        .list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime",
            maxResults=500,
        )
        .execute()
    )
    return response.get("items", [])


async def get_connected_calendars(db: AsyncSession, user_id: UUID) -> list[ConnectedCalendar]:
    result = await db.execute(
        select(ConnectedCalendar).where(ConnectedCalendar.user_id == user_id).order_by(ConnectedCalendar.created_at)
    )
    return list(result.scalars().all())


async def get_busy_events_for_week(db: AsyncSession, user_id: UUID, week_start: date) -> list[CalendarEvent]:
    week_start_dt = datetime.combine(week_start, time.min, tzinfo=UTC)
    week_end_dt = week_start_dt + timedelta(days=7)
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user_id,
            CalendarEvent.is_busy.is_(True),
            CalendarEvent.start_at >= week_start_dt,
            CalendarEvent.start_at < week_end_dt,
        )
    )
    return list(result.scalars().all())


async def sync_calendar(db: AsyncSession, user_id: UUID, connected_calendar_id: UUID) -> CalendarSyncResult:
    calendar_result = await db.execute(
        select(ConnectedCalendar).where(
            ConnectedCalendar.id == connected_calendar_id,
            ConnectedCalendar.user_id == user_id,
        )
    )
    connected_calendar = calendar_result.scalar_one_or_none()
    if not connected_calendar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connected calendar not found")

    credentials = _build_google_credentials(connected_calendar)
    if credentials.expired and credentials.refresh_token:
        await asyncio.to_thread(_refresh_google_credentials, credentials)
        if credentials.token:
            connected_calendar.access_token = encrypt_token(credentials.token)
        if credentials.expiry:
            expiry = credentials.expiry
            connected_calendar.token_expiry = (
                expiry.astimezone(UTC) if expiry.tzinfo else expiry.replace(tzinfo=UTC)
            )

    now = datetime.now(UTC)
    current_week_start = (now - timedelta(days=now.weekday())).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    rolling_end = current_week_start + timedelta(days=35)
    items = await asyncio.to_thread(
        _fetch_events,
        credentials,
        connected_calendar.calendar_id,
        current_week_start.isoformat(),
        rolling_end.isoformat(),
    )

    synced_at = datetime.now(UTC)
    synced_count = 0
    for item in items:
        if item.get("status") == "cancelled":
            continue
        if item.get("transparency") == "transparent":
            continue
        if "start" not in item or "end" not in item or not item.get("id"):
            continue

        start_at, is_all_day = _to_utc_datetime(item["start"])
        end_at, _ = _to_utc_datetime(item["end"])
        external_event_id = item["id"]

        existing_result = await db.execute(
            select(CalendarEvent).where(
                CalendarEvent.connected_calendar_id == connected_calendar.id,
                CalendarEvent.external_event_id == external_event_id,
            )
        )
        calendar_event = existing_result.scalar_one_or_none()
        if not calendar_event:
            calendar_event = CalendarEvent(
                user_id=user_id,
                connected_calendar_id=connected_calendar.id,
                external_event_id=external_event_id,
                title=item.get("summary") or "(No title)",
                start_at=start_at,
                end_at=end_at,
            )
            db.add(calendar_event)

        calendar_event.title = item.get("summary") or "(No title)"
        calendar_event.description = item.get("description")
        calendar_event.start_at = start_at
        calendar_event.end_at = end_at
        calendar_event.is_all_day = is_all_day
        calendar_event.is_recurring = bool(item.get("recurringEventId") or item.get("recurrence"))
        calendar_event.raw_payload = item
        calendar_event.last_synced_at = synced_at
        calendar_event.is_busy = True
        synced_count += 1

    connected_calendar.last_synced_at = synced_at
    await db.commit()

    return CalendarSyncResult(
        calendar_id=connected_calendar.calendar_id,
        events_synced=synced_count,
        last_synced_at=synced_at,
    )
