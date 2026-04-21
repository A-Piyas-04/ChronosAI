from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest
from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.main import app
from app.workers.calendar_tasks import sync_all_user_calendars_task, sync_calendar_task
from app.workers.celery_app import celery_app
from app.workers.schedule_tasks import generate_schedule_task


def test_sync_calendar_task_success() -> None:
    user_id = str(uuid4())
    calendar_id = str(uuid4())
    sync_result = SimpleNamespace(
        calendar_id="primary",
        events_synced=5,
        last_synced_at=datetime.now(UTC),
    )
    with patch("app.workers.calendar_tasks.sync_calendar", new=AsyncMock(return_value=sync_result)):
        result = sync_calendar_task.apply(args=[user_id, calendar_id], throw=False)

    assert result.state == "SUCCESS"
    assert "events_synced" in result.result


def test_sync_calendar_task_retries_on_exception() -> None:
    user_id = str(uuid4())
    calendar_id = str(uuid4())
    with (
        patch("app.workers.calendar_tasks.sync_calendar", new=AsyncMock(side_effect=Exception("Google API error"))),
        patch("app.workers.calendar_tasks.logger.exception") as logger_exception,
        patch.object(sync_calendar_task, "retry", side_effect=MaxRetriesExceededError("retries exhausted")),
    ):
        result = sync_calendar_task.apply(args=[user_id, calendar_id], throw=False)

    assert result.state == "FAILURE"
    logger_exception.assert_called()


def test_sync_calendar_task_does_not_retry_on_timeout() -> None:
    user_id = str(uuid4())
    calendar_id = str(uuid4())
    with (
        patch("app.workers.calendar_tasks.sync_calendar", new=AsyncMock(side_effect=SoftTimeLimitExceeded())),
        patch.object(sync_calendar_task, "retry") as retry_mock,
    ):
        result = sync_calendar_task.apply(args=[user_id, calendar_id], throw=False)

    assert result.state == "FAILURE"
    retry_mock.assert_not_called()


def test_generate_schedule_task_success() -> None:
    user_id = str(uuid4())
    schedule = SimpleNamespace(id=uuid4(), sessions=[], status="active")
    with patch("app.workers.schedule_tasks.build_schedule", new=AsyncMock(return_value=schedule)):
        result = generate_schedule_task.apply(args=[user_id, "2026-04-20", "initial"], throw=False)

    assert result.state == "SUCCESS"
    assert "schedule_id" in result.result
    assert "sessions_created" in result.result


def test_generate_schedule_task_invalid_date() -> None:
    user_id = str(uuid4())
    with patch.object(generate_schedule_task, "retry") as retry_mock:
        with pytest.raises(ValueError):
            generate_schedule_task.apply(args=[user_id, "not-a-date", "initial"], throw=True)

    retry_mock.assert_not_called()


def test_generate_schedule_task_retries_on_exception() -> None:
    user_id = str(uuid4())
    with (
        patch("app.workers.schedule_tasks.build_schedule", new=AsyncMock(side_effect=Exception("DB error"))),
        patch.object(generate_schedule_task, "retry", side_effect=MaxRetriesExceededError("retries exhausted")),
    ):
        result = generate_schedule_task.apply(args=[user_id, "2026-04-20", "initial"], throw=False)

    assert result.state == "FAILURE"


def test_sync_all_users_dispatches_tasks() -> None:
    fake_cals = [
        SimpleNamespace(id=uuid4(), user_id=uuid4(), sync_enabled=True),
        SimpleNamespace(id=uuid4(), user_id=uuid4(), sync_enabled=True),
        SimpleNamespace(id=uuid4(), user_id=uuid4(), sync_enabled=True),
    ]

    class _Result:
        def __init__(self, values):
            self._values = values

        def scalars(self):
            return self

        def all(self):
            return self._values

    class _Session:
        async def execute(self, *_args, **_kwargs):
            return _Result(fake_cals)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return False

    with (
        patch("app.workers.calendar_tasks.AsyncSessionLocal", return_value=_Session()),
        patch.object(sync_calendar_task, "apply_async") as apply_async_mock,
    ):
        result = sync_all_user_calendars_task()

    assert apply_async_mock.call_count == 3
    assert result["dispatched"] == 3


def test_job_status_endpoint_returns_pending() -> None:
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid4(), is_active=True)
    fake_async_result = SimpleNamespace(state="PENDING", result=None)

    with patch.object(celery_app, "AsyncResult", return_value=fake_async_result):
        client = TestClient(app)
        response = client.get(f"/api/v1/jobs/{uuid4()}", headers={"Authorization": "Bearer test-token"})

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["status"] == "PENDING"


def test_celery_queue_routing_configured() -> None:
    assert celery_app.conf.task_routes["app.workers.calendar_tasks.*"]["queue"] == "calendar_sync"
    assert celery_app.conf.task_routes["app.workers.schedule_tasks.*"]["queue"] == "schedule_generation"
