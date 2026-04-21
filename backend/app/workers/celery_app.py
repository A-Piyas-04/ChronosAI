from celery import Celery
from kombu import Exchange, Queue

from app.core.config import settings

celery_app = Celery(
    "chronos",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.calendar_tasks",
        "app.workers.schedule_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
    task_queues=(
        Queue("calendar_sync", Exchange("calendar_sync"), routing_key="calendar_sync"),
        Queue("schedule_generation", Exchange("schedule_generation"), routing_key="schedule_generation"),
    ),
    task_default_queue="calendar_sync",
    task_routes={
        "app.workers.calendar_tasks.*": {"queue": "calendar_sync"},
        "app.workers.schedule_tasks.*": {"queue": "schedule_generation"},
    },
    beat_schedule={
        "sync-all-calendars-every-30-min": {
            "task": "app.workers.calendar_tasks.sync_all_user_calendars_task",
            "schedule": 1800,
            "options": {"queue": "calendar_sync"},
        },
    },
)
