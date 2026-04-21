from datetime import UTC, date, datetime, time
from uuid import uuid4

from app.models.calendar_event import CalendarEvent
from app.models.task import Task
from app.models.user_preferences import UserPreferences
from app.services.scheduling_engine import generate_weekly_plan


def build_preferences() -> UserPreferences:
    return UserPreferences(
        user_id=uuid4(),
        work_days=[0, 1, 2, 3, 4],
        work_start_time=time(9, 0),
        work_end_time=time(17, 0),
        productive_start_time=None,
        productive_end_time=None,
        deep_work_session_minutes=60,
        short_break_minutes=10,
        max_deep_work_sessions_per_day=2,
        default_task_session_minutes=45,
        allow_weekend_scheduling=False,
        role_type=None,
    )


def test_scheduler_respects_busy_event_blocks() -> None:
    user_id = uuid4()
    week_start = date(2026, 4, 20)
    task = Task(
        id=uuid4(),
        user_id=user_id,
        title="Focus Work",
        estimated_minutes=120,
        priority="high",
        task_type="deep",
        classification_source="manual",
        status="inbox",
        is_flexible=True,
    )
    event = CalendarEvent(
        id=uuid4(),
        user_id=user_id,
        connected_calendar_id=uuid4(),
        external_event_id="evt-1",
        title="Meeting",
        start_at=datetime(2026, 4, 20, 9, 30, tzinfo=UTC),
        end_at=datetime(2026, 4, 20, 10, 30, tzinfo=UTC),
        is_busy=True,
    )
    plan = generate_weekly_plan(week_start, [task], [event], build_preferences())

    assert plan
    assert all(
        not (session.planned_start_at < event.end_at and session.planned_end_at > event.start_at)
        for session in plan
    )


def test_scheduler_prioritizes_urgent_tasks() -> None:
    user_id = uuid4()
    week_start = date(2026, 4, 20)
    urgent_task = Task(
        id=uuid4(),
        user_id=user_id,
        title="Urgent Item",
        estimated_minutes=30,
        priority="urgent",
        task_type="mechanical",
        classification_source="manual",
        status="inbox",
        is_flexible=True,
    )
    medium_task = Task(
        id=uuid4(),
        user_id=user_id,
        title="Medium Item",
        estimated_minutes=30,
        priority="medium",
        task_type="mechanical",
        classification_source="manual",
        status="inbox",
        is_flexible=True,
    )

    plan = generate_weekly_plan(week_start, [medium_task, urgent_task], [], build_preferences())
    task_sessions = [session for session in plan if session.task_id is not None]

    assert task_sessions
    assert task_sessions[0].title == "Urgent Item"
