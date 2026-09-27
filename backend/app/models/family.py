from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class Family(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "families"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
