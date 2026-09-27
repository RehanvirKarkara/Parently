from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent, get_family_id, get_family_parent_ids
from app.models import HealthLog, Parent, User, FamilyMember
from app.schemas import CheckInCreate
from app.schemas.common import HealthLogOut

router = APIRouter(prefix="/health-logs", tags=["health"])


def _resolve_parent(db, principal, payload_parent_id):
    if payload_parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Parent not found")
    return db.get(Parent, payload_parent_id)


@router.get("", response_model=list[HealthLogOut])
def list_health_logs(
    parent_id: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    q = db.query(HealthLog)
    if parent_id:
        q = q.filter(HealthLog.parent_id == parent_id)
    else:
        parent_ids = get_family_parent_ids(db, principal)
        q = q.filter(HealthLog.parent_id.in_(parent_ids))
    return q.order_by(HealthLog.log_date.desc()).offset(skip).limit(limit).all()


@router.get("/{parent_id}/{log_date}/{period}", response_model=HealthLogOut | None)
def get_health_log(
    parent_id: str,
    log_date: date,
    period: str,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    if parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Parent not found")
    log = (
        db.query(HealthLog)
        .filter(
            HealthLog.parent_id == parent_id,
            HealthLog.log_date == log_date,
            HealthLog.log_time_of_day == period,
        )
        .first()
    )
    return log


@router.post("", response_model=HealthLogOut)
def submit_check_in(
    payload: CheckInCreate,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    if payload.parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Parent not found")
    parent = db.get(Parent, payload.parent_id)
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")
    existing = (
        db.query(HealthLog)
        .filter(
            HealthLog.parent_id == payload.parent_id,
            HealthLog.log_date == payload.log_date,
            HealthLog.log_time_of_day == payload.log_time_of_day,
        )
        .first()
    )
    is_new = existing is None
    if existing:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        log = existing
    else:
        log = HealthLog(
            parent_id=payload.parent_id,
            log_date=payload.log_date,
            log_time_of_day=payload.log_time_of_day,
            hours_slept=payload.hours_slept,
            meds_taken=payload.meds_taken,
            breakfast_details=payload.breakfast_details,
            lunch_details=payload.lunch_details,
            steps_walked_afternoon=payload.steps_walked_afternoon,
            workout_details=payload.workout_details,
            snacks_dinner_details=payload.snacks_dinner_details,
            steps_walked_evening=payload.steps_walked_evening,
            day_rating=payload.day_rating,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

    # Event notification: a new (not updated) check-in completed -> notify children
    if is_new:
        _notify_checkin_completed(db, parent, payload)
    return log


def _notify_checkin_completed(db, parent, payload):
    from app.services import notification as notif_service
    fam_id = parent.family_id
    period = payload.log_time_of_day
    summary_parts = []
    if payload.hours_slept is not None:
        summary_parts.append(f"{payload.hours_slept}h sleep")
    if payload.day_rating is not None:
        summary_parts.append(f"mood {payload.day_rating}/10")
    if payload.meds_taken:
        summary_parts.append("medication taken")
    detail = ", ".join(summary_parts) if summary_parts else "check-in recorded"
    notif_service.notify_all_children(
        db, fam_id, type="checkin_completed",
        title=f"{parent.first_name} logged a check-in",
        message=f"{parent.first_name} {parent.last_name} recorded their {period} check-in ({detail}).",
        category="check_in",
    )

