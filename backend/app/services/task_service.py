from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


async def create_task(db: AsyncSession, user: User, payload: TaskCreate) -> Task:
    task = Task(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        estimated_minutes=payload.estimated_minutes,
        deadline_at=payload.deadline_at,
        priority=payload.priority,
        task_type=payload.task_type,
        preferred_time_of_day=payload.preferred_time_of_day,
        earliest_start_at=payload.earliest_start_at,
        is_flexible=payload.is_flexible,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def list_tasks(db: AsyncSession, user: User, include_archived: bool = False) -> list[Task]:
    query = select(Task).where(Task.user_id == user.id)
    if not include_archived:
        query = query.where(Task.archived_at.is_(None))
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_task_or_404(db: AsyncSession, user_id: UUID, task_id: UUID) -> Task:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.archived_at.is_(None))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


async def update_task(db: AsyncSession, task: Task, payload: TaskUpdate) -> Task:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


async def archive_task(db: AsyncSession, task: Task) -> None:
    task.archived_at = datetime.now(UTC)
    await db.commit()
