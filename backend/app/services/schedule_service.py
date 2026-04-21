from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schedule import Schedule

async def get_schedule_by_week(db: AsyncSession, user_id: UUID, week_start_date: date) -> Schedule:
    result = await db.execute(
        select(Schedule)
        .where(Schedule.user_id == user_id, Schedule.week_start_date == week_start_date)
        .options(selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return schedule


async def get_schedule_by_id(db: AsyncSession, user_id: UUID, schedule_id: UUID) -> Schedule:
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id, Schedule.user_id == user_id)
        .options(selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return schedule
