from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.schedule import ScheduleGenerateRequest, ScheduleResponse
from app.services.schedule_service import get_schedule_by_id, get_schedule_by_week
from app.services.scheduling_engine import build_schedule

router = APIRouter()


@router.post("/generate", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def generate_schedule_route(
    payload: ScheduleGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleResponse:
    schedule = await build_schedule(
        db=db,
        user_id=current_user.id,
        week_start_date=payload.week_start_date,
        generation_type=payload.generation_type,
    )
    return ScheduleResponse.model_validate(schedule)


@router.get("/", response_model=ScheduleResponse)
async def get_schedule_for_week_route(
    week_start_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleResponse:
    schedule = await get_schedule_by_week(db, current_user.id, week_start_date)
    return ScheduleResponse.model_validate(schedule)


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule_by_id_route(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleResponse:
    schedule = await get_schedule_by_id(db, current_user.id, schedule_id)
    return ScheduleResponse.model_validate(schedule)
