"""Notification records plus optional FCM push and email delivery."""
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Notification, Parent, User
from app.services import email as email_service

logger = logging.getLogger(__name__)

FCM_URL = "https://fcm.googleapis.com/fcm/send"

# category -> (default title prefix, human readable label)
CATEGORY_TITLES = {
    "check_in": "Daily Check-In Reminder",
    "medication": "Medication Reminder",
    "report": "Health Report Ready",
    "system": "Parently",
}


def create_notification(
    db: Session,
    *,
    message: str,
    type: str,
    recipient_user_id: str | None = None,
    recipient_parent_id: str | None = None,
    related_log_id: str | None = None,
    title: str | None = None,
    category: str = "system",
    dedup_key: str | None = None,
    metadata_json: dict | None = None,
) -> Notification:
    notification = Notification(
        recipient_user_id=recipient_user_id,
        recipient_parent_id=recipient_parent_id,
        type=type,
        message=message,
        title=title,
        category=category,
        related_log_id=related_log_id,
        dedup_key=dedup_key,
        metadata_json=metadata_json,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def notification_exists(db: Session, *, dedup_key: str) -> bool:
    """Return True if a notification with this dedup_key already exists (for scheduled-task de-duplication)."""
    if not dedup_key:
        return False
    return db.execute(select(Notification).where(Notification.dedup_key == dedup_key)).first() is not None


def notify_all_children(db: Session, family_id: str, type: str, message: str, title: str | None = None, category: str = "system", dedup_key: str | None = None) -> list[Notification]:
    from app.models import FamilyMember
    members = (
        db.query(FamilyMember)
        .filter(FamilyMember.family_id == family_id, FamilyMember.is_active.is_(True))
        .all()
    )
    created: list[Notification] = []
    for member in members:
        if dedup_key and notification_exists(db, dedup_key=dedup_key):
            continue
        created.append(
            create_notification(
                db,
                recipient_user_id=member.user_id,
                type=type,
                message=message,
                title=title,
                category=category,
                dedup_key=dedup_key,
            )
        )
    return created


def push_parent(db: Session, parent: Parent, type: str, message: str, title: str | None = None, category: str = "system", dedup_key: str | None = None) -> Notification | None:
    if dedup_key and notification_exists(db, dedup_key=dedup_key):
        return None
    if not settings.FCM_SERVER_KEY:
        logger.info("[push:dev] To parent %s (%s): %s", parent.id, parent.email, message)
    else:
        _send_fcm(settings.FCM_SERVER_KEY, None, title or "Parently", message)
    return create_notification(
        db,
        recipient_parent_id=parent.id,
        type=type,
        message=message,
        title=title,
        category=category,
        dedup_key=dedup_key,
    )


def send_notification_email(db: Session, notification: Notification) -> bool:
    """Deliver a notification via email to its recipient (reuses the existing Brevo/SMTP path)."""
    recipient = None
    subj_title = notification.title or CATEGORY_TITLES.get(notification.category, "Parently")
    if notification.recipient_user_id:
        user = db.get(User, notification.recipient_user_id)
        if user is not None:
            recipient = user.email
    elif notification.recipient_parent_id:
        parent = db.get(Parent, notification.recipient_parent_id)
        if parent is not None:
            recipient = parent.email
    if recipient is None:
        return False
    subject = f"{subj_title} — {notification.category}"
    return email_service.send_email(recipient, subject, notification.message)


def _send_fcm(server_key: str, token: str | None, title: str, body: str) -> None:
    try:
        payload = {
            "notification": {"title": title, "body": body},
            "to": token if token else "/topics/parently",
        }
        httpx.post(
            FCM_URL,
            headers={
                "Authorization": f"key={server_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
    except httpx.HTTPError as exc:
        logger.warning("FCM push failed: %s", exc)


def email_user(db: Session, user: User, subject: str, body: str) -> None:
    email_service.send_email(user.email, subject, body)
