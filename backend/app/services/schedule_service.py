from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.calendar_event import CalendarEvent
from app.models.schedule import Schedule
from app.models.schedule_session import ScheduleSession
from app.models.task import Task
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.schemas.schedule import ScheduleGenerateRequest
from app.services.scheduling_engine import generate_weekly_plan


async def generate_schedule(db: AsyncSession, user: User, payload: ScheduleGenerateRequest) -> Schedule:
    preferences_result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == user.id)
    )
    preferences = preferences_result.scalar_one_or_none()
    if not preferences:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User preferences not found")

    week_start = payload.week_start_date
    week_end = week_start + timedelta(days=6)
    start_dt = datetime.combine(week_start, datetime.min.time(), tzinfo=UTC)
    end_dt = datetime.combine(week_end + timedelta(days=1), datetime.min.time(), tzinfo=UTC)

    task_result = await db.execute(
        select(Task).where(
            Task.user_id == user.id,
            Task.archived_at.is_(None),
            Task.status.in_(["inbox", "scheduled", "in_progress", "deferred"]),
        )
    )
    tasks = list(task_result.scalars().all())

    event_result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user.id,
            CalendarEvent.start_at < end_dt,
            CalendarEvent.end_at > start_dt,
        )
    )
    events = list(event_result.scalars().all())

    plan = generate_weekly_plan(week_start, tasks, events, preferences)
    schedule = Schedule(
        user_id=user.id,
        week_start_date=week_start,
        week_end_date=week_end,
        generation_type=payload.generation_type,
        status="draft",
        generated_at=datetime.now(UTC),
        based_on_task_count=len(tasks),
        based_on_event_count=len(events),
    )
    db.add(schedule)
    await db.flush()

    for index, item in enumerate(plan):
        db.add(
            ScheduleSession(
                schedule_id=schedule.id,
                user_id=user.id,
                task_id=item.task_id,
                session_type=item.session_type,
                title=item.title,
                planned_start_at=item.planned_start_at,
                planned_end_at=item.planned_end_at,
                planned_duration_minutes=item.planned_duration_minutes,
                status="planned",
                source=item.source,
                position_index=index,
            )
        )

    await db.commit()
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule.id)
        .options(selectinload(Schedule.sessions))
    )
    return result.scalar_one()
