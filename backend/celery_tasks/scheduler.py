"""Background-job scheduler service (Reminder Service).

Thin orchestration layer over the existing notification/report services. Kept
free of Celery imports so the logic is unit-testable in-process.
"""
import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_family_id
from app.models import Family, FamilyMember, HealthLog, Medicine, Parent, Report
from app.services import notification as notif_service
from app.services.report_service import generate_report

logger = logging.getLogger(__name__)

DAILY_CHECKIN_TIMES = ("morning", "afternoon", "evening")
MEDICATION_MISSED_WINDOW = timedelta(hours=3)
MEDICATION_ESCALATE_AFTER = timedelta(hours=8)


# ---------------------------------------------------------------------------
# Daily parent health-check-in reminders
# ---------------------------------------------------------------------------
def daily_checkin_reminders(db: Session, due_date: date | None = None) -> int:
    """Schedule (via push_parent) a reminder for each not-yet-completed check-in period for today."""
    due_date = due_date or datetime.now(timezone.utc).date()
    sent = 0
    completed = {
        (row[0], row[1])
        for row in db.execute(
            select(HealthLog.parent_id, HealthLog.log_time_of_day)
            .where(HealthLog.log_date == due_date)
        ).all()
    }
    for parent in db.query(Parent).filter(Parent.is_active.is_(True)).all():
        for period in DAILY_CHECKIN_TIMES:
            if (parent.id, period) in completed:
                continue
            key = f"checkin_reminder:{parent.id}:{due_date}:{period}"
            if not notif_service.notification_exists(db, dedup_key=key):
                msg = (
                    f"Friendly reminder to log your {period} check-in for {due_date}. "
                    "Open the Parently app to record sleep, meals, activity, and mood."
                )
                notif_service.push_parent(
                    db, parent, type="checkin_reminder", message=msg,
                    category="check_in", dedup_key=key,
                )
                sent += 1
    return sent


# ---------------------------------------------------------------------------
# Medication reminders
# ---------------------------------------------------------------------------
def medication_reminders(db: Session, now: datetime | None = None) -> int:
    """Emit a reminder for each active medicine whose scheduled time is near."""
    now = now or datetime.now(timezone.utc)
    sent = 0
    medicines = (
        db.query(Medicine)
        .filter(Medicine.is_active.is_(True), Medicine.time.isnot(None), Medicine.start_date.isnot(None))
        .all()
    )
    for med in medicines:
        try:
            hh, mm = [int(x) for x in med.time.split(":")]
        except (ValueError, AttributeError):
            continue
        due_dt = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        if med.end_date is not None and due_dt.date() > med.end_date:
            continue
        # remind within a 5h window around the scheduled time
        if not (due_dt - timedelta(minutes=30) <= now <= due_dt + timedelta(hours=2)):
            continue
        key = f"med_reminder:{med.parent_id}:{med.id}:{due_dt.date().isoformat()}"
        if notif_service.notification_exists(db, dedup_key=key):
            continue  # already sent today
        parent = db.get(Parent, med.parent_id)
        if parent is None:
            continue
        notif_service.push_parent(
            db, parent, type="med_reminder", title=f"Time for {med.name}",
            message=f"Tap to confirm you've taken {med.name} ({med.dosage or 'as prescribed'}) now.",
            category="medication", dedup_key=key,
        )
        sent += 1
    return sent


def missed_medication_alerts(db: Session, now: datetime | None = None) -> int:
    """If a medicine was not recorded taken within the grace window, notify the parent; after the
    escalation delay also notify linked children."""
    now = now or datetime.now(timezone.utc)
    sent = 0
    for med in db.query(Medicine).filter(Medicine.is_active.is_(True), Medicine.time.isnot(None)).all():
        try:
            hh, mm = [int(x) for x in med.time.split(":")]
        except (ValueError, AttributeError):
            continue
        due_dt = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        if now < due_dt + MEDICATION_MISSED_WINDOW:
            continue
        parent = db.get(Parent, med.parent_id)
        if parent is None:
            continue
        if now >= due_dt + MEDICATION_ESCALATE_AFTER:
            child_key = f"med_escalated:{med.parent_id}:{med.id}:{due_dt.date().isoformat()}"
            if not notif_service.notification_exists(db, dedup_key=child_key):
                fam_id = get_family_id(db, parent)
                if fam_id:
                    notif_service.notify_all_children(
                        db, fam_id, type="med_missed_child",
                        title="Medication not taken",
                        message=f"{parent.first_name} has not taken {med.name} yet today. Please check on them.",
                        category="medication",
                    )
                    sent += 1
                notif_service.push_parent(
                    db, parent, type="med_missed_parent",
                    message=f"You have not recorded taking {med.name} yet today. Please update if taken.",
                    category="medication", dedup_key=f"med_missed:{med.parent_id}:{med.id}:{due_dt.date().isoformat()}",
                )
                sent += 1
    return sent


# ---------------------------------------------------------------------------
# Missed daily check-in
# ---------------------------------------------------------------------------
def missed_checkin_alerts(db: Session, due_date: date | None = None) -> int:
    due_date = due_date or datetime.now(timezone.utc).date()
    sent = 0
    checked_parents = {
        row[0]
        for row in db.execute(
            select(HealthLog.parent_id).where(HealthLog.log_date == due_date)
        ).all()
    }
    for parent in db.query(Parent).filter(Parent.is_active.is_(True)).all():
        if parent.id in checked_parents:
            continue
        key = f"checkin_missed:{parent.id}:{due_date}"
        if not notif_service.notification_exists(db, dedup_key=key):
            notif_service.push_parent(
                db, parent, type="checkin_missed",
                message="It looks like today's check-in is missing. Please log it in the Parently app.",
                category="check_in", dedup_key=key,
            )
            sent += 1
    return sent


# ---------------------------------------------------------------------------
# Weekly report automation
# ---------------------------------------------------------------------------
def weekly_reports_for_all_families(db: Session) -> int:
    """Generate a weekly report for every family that hasn't had one generated in the last 24h (idempotent)."""
    sent = 0
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    for family in db.query(Family).all():
        recent = (
            db.execute(
                select(Report.id)
                .where(Report.family_id == family.id, Report.report_type == "weekly", Report.generated_at >= cutoff)
            ).first()
        )
        if recent:
            continue
        generate_report(db, family_id=family.id, report_type="weekly")
        notif_service.notify_all_children(
            db, family.id, type="weekly_report", title="Weekly Health Report Ready",
            message=f"A new weekly health report is available for {family.name}. Open the Parently app to view it.",
            category="report",
        )
        sent += 1
    return sent
