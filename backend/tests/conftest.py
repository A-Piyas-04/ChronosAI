import pytest


@pytest.fixture(autouse=True)
def eager_celery():
    """Run Celery tasks synchronously in tests."""
    from app.workers.celery_app import celery_app

    celery_app.conf.update(task_always_eager=True)
    yield
    celery_app.conf.update(task_always_eager=False)
