from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import UUIDMixin, utcnow


class AIConversation(UUIDMixin, Base):
    __tablename__ = "ai_conversations"

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("parents.id"), index=True, nullable=True
    )
    conversation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    message_history: Mapped[list] = mapped_column(
        MutableList.as_mutable(JSON), nullable=False, default=list
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
