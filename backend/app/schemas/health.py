from datetime import date

from pydantic import BaseModel, Field, field_validator


class CheckInCreate(BaseModel):
    parent_id: str
    log_date: date
    log_time_of_day: str
    hours_slept: float | None = None
    meds_taken: bool | None = None
    breakfast_details: str | None = None
    lunch_details: str | None = None
    steps_walked_afternoon: int | None = None
    workout_details: str | None = None
    snacks_dinner_details: str | None = None
    steps_walked_evening: int | None = None
    day_rating: int | None = Field(default=None, ge=1, le=10)

    @field_validator("log_time_of_day")
    @classmethod
    def _valid_period(cls, v: str) -> str:
        if v not in ("morning", "afternoon", "evening"):
            raise ValueError("log_time_of_day must be morning, afternoon, or evening")
        return v


class MedicineCreate(BaseModel):
    parent_id: str
    name: str = Field(min_length=1, max_length=255)
    dosage: str | None = None
    frequency: str | None = None
    instructions: str | None = None
    time: str | None = None
    color: str | None = None


class MedicineUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    dosage: str | None = None
    frequency: str | None = None
    instructions: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    time: str | None = None
    color: str | None = None
    is_active: bool | None = None
