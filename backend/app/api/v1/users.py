from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserPreferencesResponse, UserPreferencesUpdate
from app.services.user_service import get_user_preferences, update_user_preferences

router = APIRouter()


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def read_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPreferencesResponse:
    preferences = await get_user_preferences(db, current_user)
    return UserPreferencesResponse.model_validate(preferences)


@router.patch("/me/preferences", response_model=UserPreferencesResponse)
async def patch_preferences(
    payload: UserPreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPreferencesResponse:
    preferences = await get_user_preferences(db, current_user)
    updated = await update_user_preferences(db, preferences, payload)
    return UserPreferencesResponse.model_validate(updated)
