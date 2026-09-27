"""Email delivery facade for background jobs.

Reuses the existing Brevo/SMTP sender (`app.services.email`). Kept as its own
module so it can grow a provider abstraction (e.g. FCM/HTTP v1 push) later
without touching the scheduler.
"""
import logging

from sqlalchemy.orm import Session

from app.models import Notification
from app.services.notification import send_notification_email

logger = logging.getLogger(__name__)


def deliver_notification_email(db: Session, notification_id: str) -> bool:
    """Resolve a notification by id and email it to its recipient. Idempotent-ish:
    a notification can be emailed multiple times if invoked repeatedly; callers
    pass a dedup key to schedule tasks once."""
    notification = db.get(Notification, notification_id)
    if notification is None:
        logger.warning("email send skipped: notification %s not found", notification_id)
        return False
    return send_notification_email(db, notification)
