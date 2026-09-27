from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin

VALID_TIME_OF_DAY = ("morning", "afternoon", "evening")


class HealthLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "health_logs"

    parent_id: Mapped[str] = mapped_column(ForeignKey("parents.id"), index=True, nullable=False)
    log_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    log_time_of_day: Mapped[str] = mapped_column(String(20), nullable=False)

    hours_slept: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    meds_taken: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    breakfast_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    lunch_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    steps_walked_afternoon: Mapped[int | None] = mapped_column(Integer, nullable=True)
    workout_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    snacks_dinner_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    steps_walked_evening: Mapped[int | None] = mapped_column(Integer, nullable=True)
    day_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
