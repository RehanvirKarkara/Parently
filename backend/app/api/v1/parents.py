from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent, get_family_parent_ids
from app.models import HealthLog, Medicine, User, Parent
from app.schemas.common import HealthLogOut, MedicineOut

router = APIRouter(prefix="/parents", tags=["parents"])


def _require_parent(parent_id: str, principal: User | Parent, db: Session) -> None:
    if parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Parent not found")


@router.get("/{parent_id}/health-logs", response_model=list[HealthLogOut])
def get_parent_health_logs(
    parent_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    _require_parent(parent_id, principal, db)
    return (
        db.query(HealthLog)
        .filter(HealthLog.parent_id == parent_id)
        .order_by(HealthLog.log_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{parent_id}/health-logs/{log_date}/{period}", response_model=HealthLogOut | None)
def get_health_log(
    parent_id: str,
    log_date: date,
    period: str,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    _require_parent(parent_id, principal, db)
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


@router.get("/{parent_id}/medicines", response_model=list[MedicineOut])
def get_parent_medicines(
    parent_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    _require_parent(parent_id, principal, db)
    return (
        db.query(Medicine)
        .filter(Medicine.parent_id == parent_id, Medicine.is_active.is_(True))
        .order_by(Medicine.name)
        .offset(skip)
        .limit(limit)
        .all()
    )
