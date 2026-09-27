from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import UUIDMixin, utcnow

NOTIFICATION_CATEGORIES = (
    "check_in",
    "medication",
    "report",
    "system",
)


class Notification(UUIDMixin, Base):
    __tablename__ = "notifications"

    recipient_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=True
    )
    recipient_parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("parents.id"), index=True, nullable=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="system", nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )
    related_log_id: Mapped[str | None] = mapped_column(
        ForeignKey("health_logs.id"), nullable=True
    )
    # opaque key used for de-duplication of scheduled reminders (e.g. "med_reminder:<parent_id>:<medicine_id>:<YYYY-MM-DD>")
    dedup_key: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

