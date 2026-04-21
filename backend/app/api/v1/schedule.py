from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.schedule import ScheduleGenerateRequest, ScheduleResponse
from app.services.schedule_service import generate_schedule

router = APIRouter()


@router.post("/generate", response_model=ScheduleResponse)
async def generate_schedule_route(
    payload: ScheduleGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleResponse:
    schedule = await generate_schedule(db, current_user, payload)
    return ScheduleResponse.model_validate(schedule)
