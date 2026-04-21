from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    timezone: str = "UTC"


class GoogleCallbackRequest(BaseModel):
    code: str


class GoogleAuthorizationResponse(BaseModel):
    authorization_url: str
