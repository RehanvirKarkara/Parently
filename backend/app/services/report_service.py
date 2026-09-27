"""Weekly/monthly report generation."""
import logging
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Family, FamilyMember, HealthLog, Medicine, Parent, Report

logger = logging.getLogger(__name__)


def generate_report(
    db: Session,
    *,
    family_id: str,
    report_type: str,
    user_id: str | None = None,
) -> Report:
    if report_type not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="report_type must be weekly or monthly")

    family = db.get(Family, family_id)
    if family is None:
        raise HTTPException(status_code=404, detail="Family not found")

    if report_type == "weekly":
        period_end = date.today()
        period_start = period_end - timedelta(days=7)
    else:
        period_end = date.today()
        period_start = period_end - timedelta(days=30)

    content = _build_report_content(db, family_id, report_type, period_start, period_end)

    report = Report(
        family_id=family_id,
        report_type=report_type,
        report_period_start=period_start,
        report_period_end=period_end,
        content=content,
        generated_at=datetime.now(timezone.utc),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def _build_report_content(
    db: Session,
    family_id: str,
    report_type: str,
    start: date,
    end: date,
) -> str:
    parents = (
        db.query(Parent)
        .join(FamilyMember, FamilyMember.family_id == Parent.family_id)
        .filter(FamilyMember.family_id == family_id, Parent.is_active.is_(True))
        .all()
    )
    lines = [f"Parently {report_type.capitalize()} Report", f"Period: {start} to {end}", ""]
    for parent in parents:
        logs = (
            db.query(HealthLog)
            .filter(HealthLog.parent_id == parent.id, HealthLog.log_date >= start, HealthLog.log_date <= end)
            .all()
        )
        meds = (
            db.query(Medicine)
            .filter(Medicine.parent_id == parent.id, Medicine.is_active.is_(True))
            .all()
        )
        lines.append(f"Parent: {parent.first_name} {parent.last_name}")
        if logs:
            avg_sleep = (
                sum(l.hours_slept for l in logs if l.hours_slept is not None)
                / max(sum(1 for l in logs if l.hours_slept is not None), 1)
            )
            avg_rating = (
                sum(l.day_rating for l in logs if l.day_rating is not None)
                / max(sum(1 for l in logs if l.day_rating is not None), 1)
            )
            lines.append(f"  Avg sleep: {avg_sleep:.1f}h | Avg day rating: {avg_rating:.1f}/10")
            lines.append(f"  Check-ins submitted: {len(logs)}")
        else:
            lines.append("  No check-ins submitted this period.")
        if meds:
            lines.append("  Active medicines: " + ", ".join(m.name for m in meds))
        lines.append("")
    return "\n".join(lines)
