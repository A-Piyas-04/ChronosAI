from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decrypt_token,
    encrypt_token,
    hash_password,
    verify_password,
)
from app.models.connected_calendar import ConnectedCalendar
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.schemas.auth import LoginRequest, RegisterRequest


GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.readonly",
]


async def ensure_default_preferences(db: AsyncSession, user_id) -> UserPreferences:
    result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    prefs = UserPreferences(
        user_id=user_id,
        work_days=[0, 1, 2, 3, 4],
        work_start_time=None,
        work_end_time=None,
        productive_start_time=None,
        productive_end_time=None,
    )
    db.add(prefs)
    return prefs


async def register_user(db: AsyncSession, payload: RegisterRequest) -> str:
    result = await db.execute(select(User).where(User.email == payload.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        auth_provider="email",
        timezone=payload.timezone,
    )
    db.add(user)
    await db.flush()
    await ensure_default_preferences(db, user.id)
    await db.commit()

    return create_access_token({"sub": str(user.id)})


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> str:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

    return create_access_token({"sub": str(user.id)})


def build_google_authorization_url() -> str:
    query = urlencode(
        {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(GOOGLE_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "include_granted_scopes": "true",
        }
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


async def exchange_google_code(code: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != status.HTTP_200_OK:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token exchange failed")
        return token_response.json()


async def fetch_google_userinfo(access_token: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed to fetch Google profile")
        return response.json()


async def _upsert_connected_calendar(
    db: AsyncSession,
    user_id,
    provider_account_id: str | None,
    access_token: str,
    refresh_token: str | None,
    token_expiry: datetime | None,
) -> None:
    result = await db.execute(
        select(ConnectedCalendar).where(
            ConnectedCalendar.user_id == user_id,
            ConnectedCalendar.provider == "google",
            ConnectedCalendar.calendar_id == "primary",
        )
    )
    calendar = result.scalar_one_or_none()
    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None

    if calendar:
        calendar.provider_account_id = provider_account_id
        calendar.access_token = encrypted_access
        if encrypted_refresh:
            calendar.refresh_token = encrypted_refresh
        calendar.token_expiry = token_expiry
        calendar.is_primary = True
        calendar.sync_enabled = True
        return

    db.add(
        ConnectedCalendar(
            user_id=user_id,
            provider="google",
            provider_account_id=provider_account_id,
            calendar_id="primary",
            calendar_name="Primary",
            access_token=encrypted_access,
            refresh_token=encrypted_refresh,
            token_expiry=token_expiry,
            is_primary=True,
            sync_enabled=True,
        )
    )


async def handle_google_callback(db: AsyncSession, code: str) -> str:
    token_payload = await exchange_google_code(code)
    access_token = token_payload.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token missing access token")

    user_info = await fetch_google_userinfo(access_token)
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account missing email")

    expires_in = token_payload.get("expires_in")
    token_expiry = None
    if isinstance(expires_in, int):
        token_expiry = datetime.now(UTC) + timedelta(seconds=expires_in)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name=user_info.get("name"),
            auth_provider="google",
            hashed_password=None,
            google_account_email=email,
            profile_image_url=user_info.get("picture"),
            timezone="UTC",
        )
        db.add(user)
        await db.flush()
        await ensure_default_preferences(db, user.id)
    else:
        user.google_account_email = email
        user.profile_image_url = user_info.get("picture")

    await _upsert_connected_calendar(
        db=db,
        user_id=user.id,
        provider_account_id=user_info.get("id"),
        access_token=access_token,
        refresh_token=token_payload.get("refresh_token"),
        token_expiry=token_expiry,
    )
    await db.commit()
    return create_access_token({"sub": str(user.id)})


async def get_google_access_token(db: AsyncSession, calendar: ConnectedCalendar) -> str:
    if not calendar.access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Calendar has no access token")

    token = decrypt_token(calendar.access_token)
    if calendar.token_expiry and calendar.token_expiry > datetime.now(UTC) + timedelta(minutes=1):
        return token

    if not calendar.refresh_token:
        return token

    refresh_token = decrypt_token(calendar.refresh_token)
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    if response.status_code != status.HTTP_200_OK:
        return token

    payload = response.json()
    new_token = payload.get("access_token")
    if not new_token:
        return token

    calendar.access_token = encrypt_token(new_token)
    expires_in = payload.get("expires_in")
    if isinstance(expires_in, int):
        calendar.token_expiry = datetime.now(UTC) + timedelta(seconds=expires_in)
    await db.commit()
    return new_token
