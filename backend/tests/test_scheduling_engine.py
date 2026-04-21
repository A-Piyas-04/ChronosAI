from datetime import UTC, datetime, time, timedelta
from uuid import uuid4

from app.services.scheduling_engine import (
    TaskToSchedule,
    TimeWindow,
    compute_free_windows,
    generate_schedule,
    score_window_for_task,
    split_task_into_sessions,
)


def test_compute_free_windows_subtracts_busy_blocks() -> None:
    week_start = datetime(2026, 4, 20, 0, 0, tzinfo=UTC)
    week_end = week_start + timedelta(days=7)
    busy = [TimeWindow(start=datetime(2026, 4, 20, 10, 0, tzinfo=UTC), end=datetime(2026, 4, 20, 11, 0, tzinfo=UTC))]

    windows = compute_free_windows(
        week_start=week_start,
        week_end=week_end,
        busy_blocks=busy,
        work_start_time=time(9, 0),
        work_end_time=time(12, 0),
        work_days=[0],
    )

    assert len(windows) == 2
    assert windows[0].start.hour == 9 and windows[0].end.hour == 10
    assert windows[1].start.hour == 11 and windows[1].end.hour == 12


def test_split_task_into_sessions() -> None:
    task = TaskToSchedule(
        task_id=uuid4(),
        title="Read chapter",
        estimated_minutes=100,
        remaining_minutes=100,
        priority="medium",
        task_type="deep",
        deadline_at=None,
        preferred_time_of_day=None,
        is_flexible=True,
    )

    chunks = split_task_into_sessions(task, session_minutes=45)
    assert chunks == [45, 45, 10]


def test_score_window_for_task_prefers_matching_time() -> None:
    task = TaskToSchedule(
        task_id=uuid4(),
        title="Morning task",
        estimated_minutes=30,
        remaining_minutes=30,
        priority="low",
        task_type="mechanical",
        deadline_at=None,
        preferred_time_of_day="morning",
        is_flexible=True,
    )
    morning = TimeWindow(start=datetime(2026, 4, 20, 9, 0, tzinfo=UTC), end=datetime(2026, 4, 20, 10, 0, tzinfo=UTC))
    evening = TimeWindow(start=datetime(2026, 4, 20, 18, 0, tzinfo=UTC), end=datetime(2026, 4, 20, 19, 0, tzinfo=UTC))

    assert score_window_for_task(morning, task, {}) > score_window_for_task(evening, task, {})


def test_generate_schedule_prioritizes_urgent() -> None:
    window = TimeWindow(start=datetime(2026, 4, 20, 9, 0, tzinfo=UTC), end=datetime(2026, 4, 20, 12, 0, tzinfo=UTC))
    medium = TaskToSchedule(
        task_id=uuid4(),
        title="Medium",
        estimated_minutes=45,
        remaining_minutes=45,
        priority="medium",
        task_type="mechanical",
        deadline_at=None,
        preferred_time_of_day=None,
        is_flexible=True,
    )
    urgent = TaskToSchedule(
        task_id=uuid4(),
        title="Urgent",
        estimated_minutes=45,
        remaining_minutes=45,
        priority="urgent",
        task_type="mechanical",
        deadline_at=None,
        preferred_time_of_day=None,
        is_flexible=True,
    )

    sessions = generate_schedule(
        tasks=[medium, urgent],
        free_windows=[window],
        session_minutes=45,
        break_minutes=10,
    )

    assert sessions
    assert sessions[0].title == "Urgent"
