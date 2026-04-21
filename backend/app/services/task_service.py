from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


async def create_task(db: AsyncSession, user_id: UUID, data: TaskCreate) -> Task:
    task = Task(
        user_id=user_id,
        title=data.title,
        description=data.description,
        estimated_minutes=data.estimated_minutes,
        deadline_at=data.deadline_at,
        priority=data.priority,
        task_type=data.task_type,
        preferred_time_of_day=data.preferred_time_of_day,
        earliest_start_at=data.earliest_start_at,
        is_flexible=data.is_flexible,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_tasks(
    db: AsyncSession,
    user_id: UUID,
    status: str | None,
    skip: int,
    limit: int,
) -> list[Task]:
    query = select(Task).where(Task.user_id == user_id, Task.archived_at.is_(None))
    if status:
        query = query.where(Task.status == status)
    query = query.order_by(Task.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_task_by_id(db: AsyncSession, user_id: UUID, task_id: UUID) -> Task:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.archived_at.is_(None))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


async def update_task(db: AsyncSession, user_id: UUID, task_id: UUID, data: TaskUpdate) -> Task:
    task = await get_task_by_id(db, user_id, task_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if value is not None:
            setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, user_id: UUID, task_id: UUID) -> None:
    task = await get_task_by_id(db, user_id, task_id)
    task.archived_at = datetime.now(UTC)
    await db.commit()
