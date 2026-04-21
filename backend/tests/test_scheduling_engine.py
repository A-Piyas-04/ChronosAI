from datetime import UTC, datetime, time, timedelta
from uuid import uuid4

from app.services.scheduling_engine import (
    TaskToSchedule,
    TimeWindow,
    compute_free_windows,
    generate_schedule,
    split_task_into_sessions,
)


def _make_task(title: str, priority: str, minutes: int) -> TaskToSchedule:
    return TaskToSchedule(
        task_id=uuid4(),
        title=title,
        estimated_minutes=minutes,
        remaining_minutes=minutes,
        priority=priority,
        task_type="mechanical",
        deadline_at=None,
        preferred_time_of_day=None,
        is_flexible=True,
    )


def test_compute_free_windows_basic() -> None:
    week_start = datetime(2026, 4, 20, 0, 0, tzinfo=UTC)  # Monday
    week_end = week_start + timedelta(days=7)

    windows = compute_free_windows(
        week_start=week_start,
        week_end=week_end,
        busy_blocks=[],
        work_start_time=time(9, 0),
        work_end_time=time(17, 0),
        work_days=[0, 1, 2, 3, 4],
    )

    assert len(windows) == 5
    assert all(window.duration_minutes == 480 for window in windows)


def test_compute_free_windows_with_busy_block() -> None:
    week_start = datetime(2026, 4, 20, 0, 0, tzinfo=UTC)
    week_end = week_start + timedelta(days=7)
    busy_blocks = [
        TimeWindow(
            start=datetime(2026, 4, 20, 10, 0, tzinfo=UTC),
            end=datetime(2026, 4, 20, 11, 0, tzinfo=UTC),
        )
    ]

    windows = compute_free_windows(
        week_start=week_start,
        week_end=week_end,
        busy_blocks=busy_blocks,
        work_start_time=time(9, 0),
        work_end_time=time(17, 0),
        work_days=[0],
    )

    assert len(windows) == 2
    assert windows[0].start.hour == 9 and windows[0].end.hour == 10
    assert windows[1].start.hour == 11 and windows[1].end.hour == 17


def test_compute_free_windows_skips_non_work_days() -> None:
    week_start = datetime(2026, 4, 20, 0, 0, tzinfo=UTC)
    week_end = week_start + timedelta(days=7)

    windows = compute_free_windows(
        week_start=week_start,
        week_end=week_end,
        busy_blocks=[],
        work_start_time=time(9, 0),
        work_end_time=time(17, 0),
        work_days=[0, 1, 2, 3, 4],
    )

    assert all(window.start.weekday() in [0, 1, 2, 3, 4] for window in windows)
    assert not any(window.start.weekday() == 5 for window in windows)


def test_compute_free_windows_filters_short_windows() -> None:
    week_start = datetime(2026, 4, 20, 0, 0, tzinfo=UTC)
    week_end = week_start + timedelta(days=7)
    busy_blocks = [
        TimeWindow(
            start=datetime(2026, 4, 20, 9, 0, tzinfo=UTC),
            end=datetime(2026, 4, 20, 16, 50, tzinfo=UTC),
        )
    ]

    windows = compute_free_windows(
        week_start=week_start,
        week_end=week_end,
        busy_blocks=busy_blocks,
        work_start_time=time(9, 0),
        work_end_time=time(17, 0),
        work_days=[0],
    )

    assert windows == []


def test_split_task_into_sessions_exact_multiple() -> None:
    task = _make_task("Exact", "medium", 90)
    assert split_task_into_sessions(task, 45) == [45, 45]


def test_split_task_into_sessions_with_remainder() -> None:
    task = _make_task("Remainder", "medium", 100)
    assert split_task_into_sessions(task, 45) == [45, 45, 10]


def test_split_task_into_sessions_smaller_than_session() -> None:
    task = _make_task("Small", "medium", 30)
    assert split_task_into_sessions(task, 45) == [30]


def test_generate_schedule_places_tasks_in_order() -> None:
    free_windows = [
        TimeWindow(
            start=datetime(2026, 4, 20, 9, 0, tzinfo=UTC),
            end=datetime(2026, 4, 20, 13, 0, tzinfo=UTC),
        )
    ]
    urgent_task = _make_task("Urgent", "urgent", 60)
    low_task = _make_task("Low", "low", 30)

    sessions = generate_schedule(
        tasks=[low_task, urgent_task],
        free_windows=free_windows,
        session_minutes=60,
        break_minutes=0,
    )

    assert sessions
    assert sessions[0].title == "Urgent"


def test_generate_schedule_skips_task_if_no_space() -> None:
    free_windows = [
        TimeWindow(
            start=datetime(2026, 4, 20, 9, 0, tzinfo=UTC),
            end=datetime(2026, 4, 20, 9, 30, tzinfo=UTC),
        )
    ]
    task = _make_task("Too big", "high", 120)

    sessions = generate_schedule(
        tasks=[task],
        free_windows=free_windows,
        session_minutes=120,
        break_minutes=0,
    )

    assert sessions == []


def test_generate_schedule_respects_break_time() -> None:
    free_windows = [
        TimeWindow(
            start=datetime(2026, 4, 20, 9, 0, tzinfo=UTC),
            end=datetime(2026, 4, 20, 10, 40, tzinfo=UTC),  # 100 minutes
        )
    ]
    task_a = _make_task("Task A", "urgent", 45)
    task_b = _make_task("Task B", "high", 45)

    sessions = generate_schedule(
        tasks=[task_a, task_b],
        free_windows=free_windows,
        session_minutes=45,
        break_minutes=10,
    )

    assert len(sessions) == 2
    delta = sessions[1].start - sessions[0].start
    assert int(delta.total_seconds() / 60) == 55
