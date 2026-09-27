from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent, get_family_id
from app.models import FamilyMember, Report, User, Parent
from app.schemas import ReportGenerate, ReportOut
from app.services.report_service import generate_report as _generate

router = APIRouter(prefix="/reports", tags=["reports"])


def _require_family(principal: User | Parent, db: Session) -> FamilyMember:
    if isinstance(principal, User):
        membership = (
            db.query(FamilyMember)
            .filter(FamilyMember.user_id == principal.id, FamilyMember.is_active.is_(True))
            .first()
        )
    else:
        membership = (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == principal.family_id, FamilyMember.is_active.is_(True))
            .first()
        )
    if membership is None:
        raise HTTPException(status_code=404, detail="No family found")
    return membership


@router.get("", response_model=list[ReportOut])
def list_reports(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    membership = _require_family(principal, db)
    return (
        db.query(Report)
        .filter(Report.family_id == membership.family_id)
        .order_by(Report.generated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: str,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.family_id != get_family_id(db, principal):
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/generate", response_model=ReportOut)
def generate_report_endpoint(
    payload: ReportGenerate,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    membership = _require_family(principal, db)
    user_id = principal.id if isinstance(principal, User) else None
    report = _generate(db, family_id=membership.family_id, report_type=payload.report_type, user_id=user_id)

    # Event notification: a new report was generated -> notify linked children (and the parent if parent-generated)
    from app.services import notification as notif_service
    who = f"{principal.first_name} {principal.last_name}" if hasattr(principal, "first_name") else principal.email
    notif_service.notify_all_children(
        db, membership.family_id, type="new_report",
        title="New health report generated",
        message=f"{who} generated a new {report.report_type} report. Open the Parently app to view it.",
        category="report",
    )
    return report
