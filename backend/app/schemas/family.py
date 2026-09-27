from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ParentOut


class ParentInviteRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    date_of_birth: str | None = None
    medical_conditions: str | None = None
    allergies: str | None = None
    blood_group: str | None = None
    goals: list[str] | None = None
    phone: str | None = None
    address: str | None = None
    avatar_color: str | None = None


class ParentInviteResult(BaseModel):
    parent: ParentOut
    otp_sent: bool = True
    dev_code: str | None = None


class AcceptInviteRequest(BaseModel):
    email: EmailStr
    code: str


class SiblingInviteRequest(BaseModel):
    email: EmailStr


class SuccessResponse(BaseModel):
    success: bool = True


class SiblingInviteOut(BaseModel):
    email: str
    status: str
    invited_at: str
