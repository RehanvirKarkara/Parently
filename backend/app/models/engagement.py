from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import UUIDMixin, utcnow


class QuizQuestion(UUIDMixin, Base):
    __tablename__ = "quiz_questions"

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    options: Mapped[list | None] = mapped_column(__import__("sqlalchemy").JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class QuizAnswer(UUIDMixin, Base):
    __tablename__ = "quiz_answers"

    quiz_question_id: Mapped[str] = mapped_column(
        ForeignKey("quiz_questions.id"), index=True, nullable=False
    )
    family_member_id: Mapped[str] = mapped_column(
        ForeignKey("family_members.id"), index=True, nullable=False
    )
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class LegacyQuestion(UUIDMixin, Base):
    __tablename__ = "legacy_questions"

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class LegacyAnswer(UUIDMixin, Base):
    __tablename__ = "legacy_answers"

    legacy_question_id: Mapped[str] = mapped_column(
        ForeignKey("legacy_questions.id"), index=True, nullable=False
    )
    parent_id: Mapped[str] = mapped_column(ForeignKey("parents.id"), index=True, nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
