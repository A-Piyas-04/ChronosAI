from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.calendar_event import CalendarEvent
from app.models.schedule import Schedule
from app.models.schedule_session import ScheduleSession
from app.models.task import Task
from app.models.user import User
from app.models.user_preferences import UserPreferences


@dataclass
class TimeWindow:
    start: datetime
    end: datetime

    @property
    def duration_minutes(self) -> int:
        return int((self.end - self.start).total_seconds() / 60)


@dataclass
class TaskToSchedule:
    task_id: UUID
    title: str
    estimated_minutes: int
    remaining_minutes: int
    priority: str
    task_type: str
    deadline_at: datetime | None
    preferred_time_of_day: str | None
    is_flexible: bool


@dataclass
class PlannedSession:
    task_id: UUID
    title: str
    session_type: str
    start: datetime
    end: datetime
    duration_minutes: int
    position_index: int


def compute_free_windows(
    week_start: datetime,
    week_end: datetime,
    busy_blocks: list[TimeWindow],
    work_start_time: time,
    work_end_time: time,
    work_days: list[int],
) -> list[TimeWindow]:
    if week_start.tzinfo is None or week_end.tzinfo is None:
        raise ValueError("week_start and week_end must be timezone-aware")

    free_windows: list[TimeWindow] = []
    day_cursor = week_start
    sorted_busy = sorted(busy_blocks, key=lambda block: block.start)
    allowed_days = set(work_days)

    while day_cursor < week_end:
        current_date = day_cursor.date()
        if current_date.weekday() in allowed_days:
            day_start = datetime.combine(current_date, work_start_time, tzinfo=UTC)
            day_end = datetime.combine(current_date, work_end_time, tzinfo=UTC)
            if day_end > day_start:
                day_windows = [TimeWindow(start=day_start, end=day_end)]
                overlaps = [
                    block
                    for block in sorted_busy
                    if block.end > day_start and block.start < day_end
                ]
                for block in overlaps:
                    next_windows: list[TimeWindow] = []
                    for window in day_windows:
                        if block.end <= window.start or block.start >= window.end:
                            next_windows.append(window)
                            continue
                        if block.start > window.start:
                            next_windows.append(TimeWindow(start=window.start, end=block.start))
                        if block.end < window.end:
                            next_windows.append(TimeWindow(start=block.end, end=window.end))
                    day_windows = next_windows

                for window in day_windows:
                    if window.duration_minutes >= 15:
                        free_windows.append(window)

        day_cursor = day_cursor + timedelta(days=1)

    return sorted(free_windows, key=lambda window: window.start)


def split_task_into_sessions(task: TaskToSchedule, session_minutes: int) -> list[int]:
    if session_minutes <= 0:
        raise ValueError("session_minutes must be positive")

    durations: list[int] = []
    remaining = task.remaining_minutes
    while remaining > 0:
        chunk = min(session_minutes, remaining)
        durations.append(chunk)
        remaining -= chunk
    return durations


def score_window_for_task(window: TimeWindow, task: TaskToSchedule, prefs: dict) -> float:
    score = 0.0

    if task.preferred_time_of_day == "morning" and window.start.hour < 12:
        score += 2.0
    if task.preferred_time_of_day == "afternoon" and 12 <= window.start.hour < 17:
        score += 2.0
    if task.preferred_time_of_day == "evening" and window.start.hour >= 17:
        score += 2.0

    if task.task_type == "deep" and prefs.get("productive_start_hour") is not None:
        productive_start = prefs["productive_start_hour"]
        productive_end = prefs.get("productive_end_hour", productive_start)
        if productive_start <= window.start.hour < productive_end:
            score += 3.0

    if task.deadline_at:
        hours_until_deadline = (task.deadline_at - window.start).total_seconds() / 3600
        if hours_until_deadline < 24:
            score += 5.0
        elif hours_until_deadline < 72:
            score += 2.0

    return score


def generate_schedule(
    tasks: list[TaskToSchedule],
    free_windows: list[TimeWindow],
    session_minutes: int,
    break_minutes: int,
) -> list[PlannedSession]:
    now = datetime.now(UTC)
    priority_weights = {"urgent": 4, "high": 3, "medium": 2, "low": 1}

    def task_weight(task: TaskToSchedule) -> int:
        base = priority_weights.get(task.priority, 0)
        if task.deadline_at and (task.deadline_at - now).total_seconds() <= 48 * 3600:
            base += 2
        return base

    ordered_tasks = sorted(tasks, key=lambda task: task_weight(task), reverse=True)
    sessions: list[PlannedSession] = []
    windows = [TimeWindow(start=window.start, end=window.end) for window in sorted(free_windows, key=lambda item: item.start)]
    cursor = 0

    for task in ordered_tasks:
        for chunk_duration in split_task_into_sessions(task, session_minutes):
            placed = False
            window_index = cursor
            while window_index < len(windows):
                window = windows[window_index]
                if window.duration_minutes < chunk_duration:
                    window_index += 1
                    continue

                session_start = window.start
                session_end = session_start + timedelta(minutes=chunk_duration)
                session_type = "deep_work" if task.task_type == "deep" else "mechanical"
                sessions.append(
                    PlannedSession(
                        task_id=task.task_id,
                        title=task.title,
                        session_type=session_type,
                        start=session_start,
                        end=session_end,
                        duration_minutes=chunk_duration,
                        position_index=0,
                    )
                )
                window.start = session_end + timedelta(minutes=break_minutes)
                if window.duration_minutes < 15:
                    cursor = max(cursor, window_index + 1)
                else:
                    cursor = max(cursor, window_index)
                placed = True
                break

            if not placed:
                break

    sessions.sort(key=lambda session: session.start)
    for index, session in enumerate(sessions):
        session.position_index = index
    return sessions


async def build_schedule(
    db: AsyncSession,
    user_id: UUID,
    week_start_date: date,
    generation_type: str,
) -> Schedule:
    week_start = datetime.combine(week_start_date, time.min, tzinfo=UTC)
    week_end = week_start + timedelta(days=7)

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    prefs_result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
    preferences = prefs_result.scalar_one_or_none()
    if not preferences:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User preferences not found")

    tasks_result = await db.execute(
        select(Task).where(
            Task.user_id == user_id,
            Task.status.in_(["inbox", "scheduled"]),
            Task.archived_at.is_(None),
            or_(Task.deadline_at.is_(None), Task.deadline_at >= week_start),
        )
    )
    tasks = list(tasks_result.scalars().all())

    events_result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user_id,
            CalendarEvent.is_busy.is_(True),
            CalendarEvent.start_at < week_end,
            CalendarEvent.end_at > week_start,
        )
    )
    events = list(events_result.scalars().all())

    work_days = list(preferences.work_days)
    if preferences.allow_weekend_scheduling:
        if 5 not in work_days:
            work_days.append(5)
        if 6 not in work_days:
            work_days.append(6)
    work_days = sorted(set(work_days))

    busy_blocks = [
        TimeWindow(start=event.start_at.astimezone(UTC), end=event.end_at.astimezone(UTC))
        for event in events
    ]
    free_windows = compute_free_windows(
        week_start=week_start,
        week_end=week_end,
        busy_blocks=busy_blocks,
        work_start_time=preferences.work_start_time or time(9, 0),
        work_end_time=preferences.work_end_time or time(17, 0),
        work_days=work_days,
    )

    task_inputs = [
        TaskToSchedule(
            task_id=task.id,
            title=task.title,
            estimated_minutes=task.estimated_minutes,
            remaining_minutes=task.estimated_minutes,
            priority=task.priority,
            task_type=task.task_type,
            deadline_at=task.deadline_at,
            preferred_time_of_day=task.preferred_time_of_day,
            is_flexible=task.is_flexible,
        )
        for task in tasks
    ]
    planned_sessions = generate_schedule(
        tasks=task_inputs,
        free_windows=free_windows,
        session_minutes=preferences.default_task_session_minutes,
        break_minutes=preferences.short_break_minutes,
    )

    previous_active_result = await db.execute(
        select(Schedule).where(
            Schedule.user_id == user_id,
            Schedule.week_start_date == week_start_date,
            Schedule.status == "active",
        )
    )
    for previous in previous_active_result.scalars().all():
        previous.status = "replaced"

    schedule = Schedule(
        user_id=user_id,
        week_start_date=week_start_date,
        week_end_date=week_start_date + timedelta(days=6),
        generation_type=generation_type,
        status="active",
        generated_at=datetime.now(UTC),
        based_on_task_count=len(tasks),
        based_on_event_count=len(events),
    )
    db.add(schedule)
    await db.flush()

    scheduled_task_ids: set[UUID] = set()
    for session in planned_sessions:
        scheduled_task_ids.add(session.task_id)
        db.add(
            ScheduleSession(
                schedule_id=schedule.id,
                user_id=user_id,
                task_id=session.task_id,
                session_type=session.session_type,
                title=session.title,
                planned_start_at=session.start,
                planned_end_at=session.end,
                planned_duration_minutes=session.duration_minutes,
                status="planned",
                source="rule_engine",
                position_index=session.position_index,
            )
        )

    if scheduled_task_ids:
        tasks_to_update_result = await db.execute(select(Task).where(Task.id.in_(scheduled_task_ids)))
        for task in tasks_to_update_result.scalars().all():
            task.status = "scheduled"

    await db.commit()
    refreshed_result = await db.execute(
        select(Schedule).where(Schedule.id == schedule.id).options(selectinload(Schedule.sessions))
    )
    return refreshed_result.scalar_one()
