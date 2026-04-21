from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthorizationResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import (
    authenticate_user,
    build_google_authorization_url,
    handle_google_callback,
    register_user,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    token = await register_user(db, payload)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    token = await authenticate_user(db, payload)
    return TokenResponse(access_token=token)


@router.get("/google", response_model=GoogleAuthorizationResponse)
async def google_auth_url() -> GoogleAuthorizationResponse:
    return GoogleAuthorizationResponse(authorization_url=build_google_authorization_url())


@router.get("/google/callback", response_model=TokenResponse)
async def google_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    token = await handle_google_callback(db, code)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
