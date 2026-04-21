from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from app.models.calendar_event import CalendarEvent
from app.models.task import Task
from app.models.user_preferences import UserPreferences


@dataclass
class PlannedSession:
    task_id: UUID | None
    session_type: str
    title: str
    planned_start_at: datetime
    planned_end_at: datetime
    planned_duration_minutes: int
    source: str = "rule_engine"


PRIORITY_SCORE = {"urgent": 0, "high": 1, "medium": 2, "low": 3}


def _sorted_tasks(tasks: list[Task]) -> list[Task]:
    def sort_key(task: Task) -> tuple[int, datetime]:
        deadline = task.deadline_at or datetime.max.replace(tzinfo=UTC)
        return PRIORITY_SCORE.get(task.priority, 9), deadline

    return sorted(tasks, key=sort_key)


def _subtract_busy(
    range_start: datetime,
    range_end: datetime,
    busy_blocks: list[tuple[datetime, datetime]],
) -> list[tuple[datetime, datetime]]:
    free_blocks: list[tuple[datetime, datetime]] = [(range_start, range_end)]
    for busy_start, busy_end in sorted(busy_blocks):
        next_blocks: list[tuple[datetime, datetime]] = []
        for free_start, free_end in free_blocks:
            if busy_end <= free_start or busy_start >= free_end:
                next_blocks.append((free_start, free_end))
                continue
            if busy_start > free_start:
                next_blocks.append((free_start, busy_start))
            if busy_end < free_end:
                next_blocks.append((busy_end, free_end))
        free_blocks = next_blocks
    return [(start, end) for start, end in free_blocks if end > start]


def _build_day_slots(
    day: date,
    preferences: UserPreferences,
    events: list[CalendarEvent],
) -> list[tuple[datetime, datetime]]:
    work_start = preferences.work_start_time or time(9, 0)
    work_end = preferences.work_end_time or time(17, 0)
    day_start = datetime.combine(day, work_start, tzinfo=UTC)
    day_end = datetime.combine(day, work_end, tzinfo=UTC)
    if day_end <= day_start:
        return []

    busy_blocks = [
        (
            event.start_at.astimezone(UTC),
            event.end_at.astimezone(UTC),
        )
        for event in events
        if event.is_busy and event.start_at.date() <= day <= event.end_at.date()
    ]
    return _subtract_busy(day_start, day_end, busy_blocks)


def generate_weekly_plan(
    week_start_date: date,
    tasks: list[Task],
    events: list[CalendarEvent],
    preferences: UserPreferences,
) -> list[PlannedSession]:
    work_days = set(preferences.work_days)
    if preferences.allow_weekend_scheduling:
        work_days.update({5, 6})

    sessions: list[PlannedSession] = []
    tasks_queue = _sorted_tasks(
        [task for task in tasks if task.status not in {"completed", "cancelled"} and task.archived_at is None]
    )
    remaining: dict[UUID, int] = {task.id: task.estimated_minutes for task in tasks_queue}

    for day_offset in range(7):
        day = week_start_date + timedelta(days=day_offset)
        if day.weekday() not in work_days:
            continue

        day_events = [event for event in events if event.start_at.date() <= day <= event.end_at.date()]
        free_slots = _build_day_slots(day, preferences, day_events)
        deep_sessions_used = 0
        slot_idx = 0

        for task in tasks_queue:
            if remaining[task.id] <= 0:
                continue

            while slot_idx < len(free_slots) and remaining[task.id] > 0:
                slot_start, slot_end = free_slots[slot_idx]
                if task.earliest_start_at and slot_end <= task.earliest_start_at.astimezone(UTC):
                    slot_idx += 1
                    continue
                if task.earliest_start_at and slot_start < task.earliest_start_at.astimezone(UTC):
                    slot_start = task.earliest_start_at.astimezone(UTC)

                available_minutes = int((slot_end - slot_start).total_seconds() // 60)
                if available_minutes <= 0:
                    slot_idx += 1
                    continue

                is_deep = task.task_type == "deep"
                if is_deep and preferences.max_deep_work_sessions_per_day is not None:
                    if deep_sessions_used >= preferences.max_deep_work_sessions_per_day:
                        break

                target_minutes = (
                    preferences.deep_work_session_minutes
                    if is_deep
                    else preferences.default_task_session_minutes
                )
                duration_minutes = min(remaining[task.id], target_minutes, available_minutes)
                if duration_minutes <= 0:
                    break

                planned_start = slot_start
                planned_end = planned_start + timedelta(minutes=duration_minutes)
                sessions.append(
                    PlannedSession(
                        task_id=task.id,
                        session_type="deep_work" if is_deep else "mechanical",
                        title=task.title,
                        planned_start_at=planned_start,
                        planned_end_at=planned_end,
                        planned_duration_minutes=duration_minutes,
                    )
                )
                if is_deep:
                    deep_sessions_used += 1

                remaining[task.id] -= duration_minutes

                break_minutes = preferences.short_break_minutes
                break_end = planned_end + timedelta(minutes=break_minutes)
                if break_minutes > 0 and break_end <= slot_end and remaining[task.id] > 0:
                    sessions.append(
                        PlannedSession(
                            task_id=None,
                            session_type="break",
                            title="Break",
                            planned_start_at=planned_end,
                            planned_end_at=break_end,
                            planned_duration_minutes=break_minutes,
                        )
                    )
                    planned_end = break_end

                if planned_end < slot_end:
                    free_slots[slot_idx] = (planned_end, slot_end)
                else:
                    slot_idx += 1

                if is_deep and preferences.max_deep_work_sessions_per_day is not None:
                    if deep_sessions_used >= preferences.max_deep_work_sessions_per_day:
                        break

    sessions.sort(key=lambda item: item.planned_start_at)
    return sessions
