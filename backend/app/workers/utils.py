import asyncio
from collections.abc import AsyncGenerator
from typing import Any

from app.db.session import AsyncSessionLocal


def run_async(coro: Any):
    """Run an async coroutine from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def get_task_db_session() -> AsyncGenerator:
    """Yields a DB session for use inside task coroutines."""
    async with AsyncSessionLocal() as session:
        yield session
