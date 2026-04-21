from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.schemas.user import UserPreferencesUpdate


async def get_user_preferences(db: AsyncSession, user: User) -> UserPreferences:
    result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == user.id))
    preferences = result.scalar_one_or_none()
    if not preferences:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User preferences not found")
    return preferences


async def update_user_preferences(
    db: AsyncSession,
    preferences: UserPreferences,
    payload: UserPreferencesUpdate,
) -> UserPreferences:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(preferences, field, value)
    await db.commit()
    await db.refresh(preferences)
    return preferences
