from datetime import date
from uuid import UUID

from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded

from app.core.config import settings
from app.core.logging import get_logger
from app.db.session import AsyncSessionLocal
from app.services.scheduling_engine import build_schedule
from app.workers.celery_app import celery_app
from app.workers.utils import run_async

logger = get_logger(__name__)


async def _do_generate(user_id: str, week_start_date: str, generation_type: str) -> dict:
    parsed_date = date.fromisoformat(week_start_date)
    async with AsyncSessionLocal() as db:
        schedule = await build_schedule(db, UUID(user_id), parsed_date, generation_type)
        return {
            "schedule_id": str(schedule.id),
            "week_start_date": week_start_date,
            "sessions_created": len(schedule.sessions),
            "status": schedule.status,
        }


@celery_app.task(
    bind=True,
    name="app.workers.schedule_tasks.generate_schedule_task",
    max_retries=settings.CELERY_MAX_RETRIES_SCHEDULE,
    default_retry_delay=30,
    soft_time_limit=180,
    time_limit=210,
    acks_late=True,
)
def generate_schedule_task(
    self,
    user_id: str,
    week_start_date: str,
    generation_type: str = "initial",
) -> dict:
    try:
        date.fromisoformat(week_start_date)
    except ValueError:
        logger.error("Invalid week_start_date provided: %s", week_start_date)
        raise

    try:
        return run_async(_do_generate(user_id, week_start_date, generation_type))
    except SoftTimeLimitExceeded:
        logger.error("Schedule generation timed out for user %s week_start=%s", user_id, week_start_date)
        raise
    except ValueError:
        logger.error("Invalid schedule generation input for user %s", user_id)
        raise
    except MaxRetriesExceededError:
        logger.exception("Schedule generation max retries exceeded for user %s", user_id)
        raise
    except Exception as exc:
        logger.exception("Schedule generation failed for user %s", user_id)
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
