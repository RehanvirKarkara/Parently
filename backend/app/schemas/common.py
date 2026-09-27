"""Shared/common schemas serialized to match the frontend TypeScript types."""
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORMModel):
    id: str
    email: str
    first_name: str | None
    last_name: str | None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    phone: str | None = None
    avatar_color: str | None = None


class FamilyOut(ORMModel):
    id: str
    name: str
    created_by_user_id: str
    created_at: datetime
    updated_at: datetime


class FamilyMemberOut(ORMModel):
    id: str
    family_id: str
    user_id: str
    role: str
    joined_at: datetime
    is_active: bool


class ParentOut(ORMModel):
    id: str
    family_id: str
    first_name: str
    last_name: str
    email: str
    medical_conditions: str | None
    allergies: str | None
    date_of_birth: date | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    phone: str | None = None
    address: str | None = None
    blood_group: str | None = None
    avatar_color: str | None = None
    goals: list[str] | None = None


class HealthLogOut(ORMModel):
    id: str
    parent_id: str
    log_date: date
    log_time_of_day: str
    hours_slept: float | None
    meds_taken: bool | None
    breakfast_details: str | None
    lunch_details: str | None
    steps_walked_afternoon: int | None
    workout_details: str | None
    snacks_dinner_details: str | None
    steps_walked_evening: int | None
    day_rating: int | None
    created_at: datetime
    updated_at: datetime


class MedicineOut(ORMModel):
    id: str
    parent_id: str
    name: str
    dosage: str | None
    frequency: str | None
    instructions: str | None
    start_date: date | None
    end_date: date | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    time: str | None = None
    color: str | None = None


class QuizQuestionOut(ORMModel):
    id: str
    question_text: str
    category: str | None
    options: list[str] | None = None


class QuizAnswerOut(ORMModel):
    id: str
    quiz_question_id: str
    family_member_id: str
    answer_text: str
    answered_at: datetime


class LegacyQuestionOut(ORMModel):
    id: str
    question_text: str
    created_at: datetime


class LegacyAnswerOut(ORMModel):
    id: str
    legacy_question_id: str
    parent_id: str
    answer_text: str
    answered_at: datetime


class ReportOut(ORMModel):
    id: str
    family_id: str
    report_type: str
    report_period_start: date
    report_period_end: date
    content: str
    generated_at: datetime


class AppNotificationOut(ORMModel):
    id: str
    recipient_user_id: str | None
    recipient_parent_id: str | None
    type: str
    category: str | None = None
    message: str
    is_read: bool
    sent_at: datetime
    related_log_id: str | None
    title: str | None = None
    dedup_key: str | None = None
    metadata_json: dict | None = None


class ChatMessageOut(ORMModel):
    id: str
    role: str
    content: str
    timestamp: datetime
    insight: dict[str, Any] | None = None


class AIConversationOut(ORMModel):
    id: str
    user_id: str | None
    parent_id: str | None
    conversation_type: str
    message_history: list[dict[str, Any]]
    started_at: datetime
    updated_at: datetime
