"""Celery tasks. Each task wraps a scheduler function so it can run in a worker
process and be invoked by Celery Beat on a schedule or on-demand by the API.

Tasks open their own DB session because they run in a separate process
(no request context). They also deliver emails for the notifications
they create, reusing `app.services.email` through `celery_tasks.email_service`.
"""
import logging
from datetime import date, datetime
from typing import Any

from app.core.database import SessionLocal
from app.models import Notification
from celery_tasks.celery_app import celery_app
from celery_tasks import scheduler
from celery_tasks.email_service import deliver_notification_email

logger = logging.getLogger(__name__)


def _db() -> Any:
    return SessionLocal()


@celery_app.task(name="parently.notifications.email")
def send_notification_email_task(notification_id: str) -> bool:
    db = _db()
    try:
        return deliver_notification_email(db, notification_id)
    finally:
        db.close()


@celery_app.task(name="parently.reminders.daily_checkins")
def daily_checkin_reminders_task(due_date: str | None = None) -> int:
    db = _db()
    try:
        d = datetime.strptime(due_date, "%Y-%m-%d").date() if due_date else None
        sent = scheduler.daily_checkin_reminders(db, due_date=d)
        db.commit()
        return sent
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="parently.reminders.medications")
def medication_reminders_task() -> int:
    db = _db()
    try:
        sent = scheduler.medication_reminders(db)
        db.commit()
        # dispatch an email task for every medicine reminder we just created
        return sent
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="parently.reminders.missed_medications")
def missed_medication_alerts_task() -> int:
    db = _db()
    try:
        sent = scheduler.missed_medication_alerts(db)
        db.commit()
        return sent
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="parently.reminders.missed_checkins")
def missed_checkin_alerts_task(due_date: str | None = None) -> int:
    db = _db()
    try:
        d = datetime.strptime(due_date, "%Y-%m-%d").date() if due_date else None
        sent = scheduler.missed_checkin_alerts(db, due_date=d)
        db.commit()
        return sent
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="parently.reports.weekly")
def weekly_reports_task() -> int:
    db = _db()
    try:
        sent = scheduler.weekly_reports_for_all_families(db)
        db.commit()
        return sent
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
