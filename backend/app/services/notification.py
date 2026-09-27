import logging
import os
from datetime import datetime, timezone
from pathlib import Path
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

import firebase_admin
from firebase_admin import credentials, messaging

from app.core.config import settings
from app.models import Notification, Parent, User
from app.services import email as email_service

logger = logging.getLogger(__name__)

FCM_URL = "https://fcm.googleapis.com/fcm/send"

_firebase_app: firebase_admin.App | None = None
_firebase_attempted_init = False


def get_firebase_app() -> firebase_admin.App | None:
    """Lazily initialize Firebase Admin SDK using service account credentials."""
    global _firebase_app, _firebase_attempted_init
    if _firebase_attempted_init:
        return _firebase_app

    _firebase_attempted_init = True
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if not cred_path:
        candidates = [
            Path("firebase-service-account.json"),
            Path(__file__).resolve().parent.parent.parent / "firebase-service-account.json",
        ]
        for c in candidates:
            if c.exists():
                cred_path = str(c)
                break

    if cred_path and os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin successfully initialized from %s", cred_path)
        except Exception as exc:
            logger.warning("Firebase Admin initialization failed: %s", exc)
            _firebase_app = None
    return _firebase_app


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
    notif_title = title or "Parently"
    _send_fcm(None, notif_title, message, data={"parent_id": str(parent.id), "type": str(type), "category": str(category)})
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


def _send_fcm(token: str | None, title: str, body: str, data: dict | None = None) -> bool:
    """Deliver push notification using Firebase Admin (HTTP v1) or fallback."""
    fb_app = get_firebase_app()
    if fb_app:
        try:
            fcm_notification = messaging.Notification(title=title, body=body)
            clean_data = {str(k): str(v) for k, v in (data or {}).items()}
            if token:
                msg = messaging.Message(
                    notification=fcm_notification,
                    token=token,
                    data=clean_data,
                )
            else:
                msg = messaging.Message(
                    notification=fcm_notification,
                    topic="parently",
                    data=clean_data,
                )
            response = messaging.send(msg)
            logger.info("Firebase push sent successfully: %s", response)
            return True
        except Exception as exc:
            logger.warning("Firebase push failed: %s", exc)
            return False

    if settings.FCM_SERVER_KEY:
        try:
            payload = {
                "notification": {"title": title, "body": body},
                "to": token if token else "/topics/parently",
            }
            if data:
                payload["data"] = data
            httpx.post(
                FCM_URL,
                headers={
                    "Authorization": f"key={settings.FCM_SERVER_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=10,
            )
            return True
        except httpx.HTTPError as exc:
            logger.warning("Legacy FCM push failed: %s", exc)
            return False

    logger.info("[push:dev] Title: %s | Body: %s", title, body)
    return False


def email_user(db: Session, user: User, subject: str, body: str) -> None:
    email_service.send_email(user.email, subject, body)
