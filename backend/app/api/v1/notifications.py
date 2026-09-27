from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent
from app.models import Notification, User, Parent
from app.schemas.common import AppNotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _notification_query(db: Session, principal: User | Parent):
    return db.query(Notification).filter(
        (Notification.recipient_user_id == principal.id)
        | (Notification.recipient_parent_id == principal.id)
    )


@router.get("", response_model=list[AppNotificationOut])
def list_notifications(
    principal: User | Parent = Depends(get_current_user_or_parent),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = _notification_query(db, principal)
    if category:
        q = q.filter(Notification.category == category)
    return (
        q.order_by(Notification.sent_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/unread-count", response_model=dict)
def unread_count(
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    count = _notification_query(db, principal).filter(Notification.is_read.is_(False)).count()
    return {"unread": count}


@router.post("/{notification_id}/read", response_model=dict)
def mark_read(
    notification_id: str,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    notification = db.get(Notification, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    is_mine = (
        notification.recipient_user_id == principal.id
        or notification.recipient_parent_id == principal.id
    )
    if not is_mine:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"success": True}


@router.post("/read-all", response_model=dict)
def mark_all_read(
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    notifications = _notification_query(db, principal).all()
    for n in notifications:
        n.is_read = True
    db.commit()
    return {"success": True, "marked_read": len(notifications)}
