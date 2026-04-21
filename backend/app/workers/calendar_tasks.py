from datetime import UTC, datetime
from uuid import UUID

from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.db.session import AsyncSessionLocal
from app.models.connected_calendar import ConnectedCalendar
from app.services.calendar_sync import sync_calendar
from app.workers.celery_app import celery_app
from app.workers.utils import run_async

logger = get_logger(__name__)


async def _do_sync(user_id: str, connected_calendar_id: str) -> dict:
    async with AsyncSessionLocal() as db:
        result = await sync_calendar(db, UUID(user_id), UUID(connected_calendar_id))
        return {
            "calendar_id": result.calendar_id,
            "events_synced": result.events_synced,
            "last_synced_at": result.last_synced_at.isoformat(),
        }


@celery_app.task(
    bind=True,
    name="app.workers.calendar_tasks.sync_calendar_task",
    max_retries=settings.CELERY_MAX_RETRIES_CALENDAR,
    default_retry_delay=60,
    soft_time_limit=120,
    time_limit=150,
    acks_late=True,
)
def sync_calendar_task(self, user_id: str, connected_calendar_id: str) -> dict:
    try:
        return run_async(_do_sync(user_id, connected_calendar_id))
    except SoftTimeLimitExceeded:
        logger.error("Calendar sync timed out for calendar %s", connected_calendar_id)
        raise
    except MaxRetriesExceededError:
        logger.exception("Calendar sync max retries exceeded for calendar %s", connected_calendar_id)
        raise
    except Exception as exc:
        logger.exception("Calendar sync failed for calendar %s", connected_calendar_id)
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


async def _do_sync_all() -> dict:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ConnectedCalendar).where(ConnectedCalendar.sync_enabled.is_(True))
        )
        calendars = list(result.scalars().all())
        for index, calendar in enumerate(calendars):
            sync_calendar_task.apply_async(
                args=[str(calendar.user_id), str(calendar.id)],
                queue="calendar_sync",
                countdown=index * 2,
            )
        return {"dispatched": len(calendars)}


@celery_app.task(
    name="app.workers.calendar_tasks.sync_all_user_calendars_task",
    max_retries=1,
    soft_time_limit=600,
    time_limit=660,
)
def sync_all_user_calendars_task() -> dict:
    try:
        result = run_async(_do_sync_all())
        result["triggered_at"] = datetime.now(UTC).isoformat()
        return result
    except Exception:
        logger.exception("Failed dispatching sync_all_user_calendars_task")
        raise
