from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import ORMModel, UserOut

OTP_PURPOSES = ("parent_invite", "email_verification", "password_reset")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    agree_terms: bool = True
    agree_privacy: bool = True
    agree_health_processing: bool = True
    opt_in_marketing: bool = False
    policy_version: str = "v1.0"

    @field_validator("password")
    @classmethod
    def _password_not_blank(cls, v: str) -> str:
        if v.strip() == "":
            raise ValueError("Password must not be blank.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserOut
    tokens: TokenPair
    mode: str
    parent_id: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class OtpRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(pattern="parent_invite|email_verification|password_reset")


class OtpResponse(BaseModel):
    success: bool = True
    dev_code: str | None = None


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    code: str
    purpose: str = Field(pattern="parent_invite|email_verification|password_reset")


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(min_length=6, max_length=128)


class ParentRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    @field_validator("password")
    @classmethod
    def _password_not_blank(cls, v: str) -> str:
        if v.strip() == "":
            raise ValueError("Password must not be blank.")
        return v


class ParentActivateRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)
    authorized_scopes: list[str] | None = Field(
        default=None,
        description="Scopes granted to family: checkins, medications, vitals, reports, ai_summaries",
    )
    agree_terms: bool = True
    agree_privacy: bool = True
    policy_version: str = "v1.0"


class ParentActivateResult(BaseModel):
    success: bool = True
    already_active: bool = False
