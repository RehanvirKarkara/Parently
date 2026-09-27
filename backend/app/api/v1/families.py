from fastapi import APIRouter, Depends, HTTPException, Query, Request
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent
from app.core.ratelimit import check_rate_limit
from app.models import Family, FamilyMember, OTPCode, Parent, User
from app.schemas import (
    AcceptInviteRequest,
    ParentInviteRequest,
    ParentInviteResult,
    SiblingInviteOut,
    SiblingInviteRequest,
    SuccessResponse,
)
from app.services import otp as otp_service
from app.schemas.common import FamilyOut, FamilyMemberOut, ParentOut, UserOut

router = APIRouter(prefix="/families", tags=["families"])


def _resolve_membership(
    db: Session,
    user_or_parent: User | Parent,
) -> FamilyMember | None:
    if isinstance(user_or_parent, User):
        return (
            db.query(FamilyMember)
            .filter(FamilyMember.user_id == user_or_parent.id, FamilyMember.is_active.is_(True))
            .first()
        )
    return (
        db.query(FamilyMember)
        .filter(FamilyMember.family_id == user_or_parent.family_id, FamilyMember.is_active.is_(True))
        .first()
    )


@router.get("/me", response_model=FamilyOut)
def get_my_family(user_or_parent: User | Parent = Depends(get_current_user_or_parent), db: Session = Depends(get_db)) -> FamilyOut:
    membership = _resolve_membership(db, user_or_parent)
    if membership is None:
        raise HTTPException(status_code=404, detail="No family found")
    family = db.get(Family, membership.family_id)
    if family is None:
        raise HTTPException(status_code=404, detail="Family not found")
    return family


@router.get("/me/members", response_model=list[FamilyMemberOut])
def get_family_members(
    user_or_parent: User | Parent = Depends(get_current_user_or_parent),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    membership = _resolve_membership(db, user_or_parent)
    if membership is None:
        return []
    return (
        db.query(FamilyMember)
        .filter(FamilyMember.family_id == membership.family_id, FamilyMember.is_active.is_(True))
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/me/users", response_model=list[UserOut])
def get_family_users(
    user_or_parent: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    membership = _resolve_membership(db, user_or_parent)
    if membership is None:
        return []
    members = db.query(FamilyMember).filter(FamilyMember.family_id == membership.family_id).all()
    user_ids = [m.user_id for m in members]
    return db.query(User).filter(User.id.in_(user_ids)).all()


@router.get("/parents", response_model=list[ParentOut])
def get_parents(
    user_or_parent: User | Parent = Depends(get_current_user_or_parent),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    membership = _resolve_membership(db, user_or_parent)
    if membership is None:
        if isinstance(user_or_parent, Parent):
            return (
                db.query(Parent)
                .filter(Parent.family_id == user_or_parent.family_id, Parent.is_active.is_(True))
                .offset(skip)
                .limit(limit)
                .all()
            )
        return []
    return (
        db.query(Parent)
        .filter(Parent.family_id == membership.family_id, Parent.is_active.is_(True))
        .order_by(Parent.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/parents/{parent_id}", response_model=ParentOut)
def get_parent(
    parent_id: str,
    user_or_parent: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    parent = db.get(Parent, parent_id)
    if parent is None or not parent.is_active:
        raise HTTPException(status_code=404, detail="Parent not found")
    membership = _resolve_membership(db, user_or_parent)
    if membership is None or membership.family_id != parent.family_id:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent


@router.post("/me/parents/invite", response_model=ParentInviteResult)
def invite_parent(
    payload: ParentInviteRequest,
    request: Request,
    db: Session = Depends(get_db),
    user_or_parent: User | Parent = Depends(get_current_user_or_parent),
):
    check_rate_limit(request, key="parent_invite")
    membership = _resolve_membership(db, user_or_parent)
    if membership is None:
        raise HTTPException(status_code=404, detail="No family found for this user")
    family_id = membership.family_id

    existing = db.query(Parent).filter(Parent.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="A parent with this email is already in your family.")

    parent = Parent(
        family_id=family_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email.lower(),
        medical_conditions=payload.medical_conditions,
        allergies=payload.allergies,
        date_of_birth=datetime.strptime(payload.date_of_birth, "%Y-%m-%d").date() if payload.date_of_birth else None,
        phone=payload.phone,
        address=payload.address,
        blood_group=payload.blood_group,
        goals=payload.goals,
        avatar_color=payload.avatar_color,
        is_active=False,
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)

    record = otp_service.issue_otp(db, payload.email, "parent_invite")
    result = otp_service.deliver(record, "parent_invite")
    return ParentInviteResult(parent=parent, otp_sent=True, dev_code=result.get("dev_code"))


@router.post("/me/parents/invite/accept", response_model=SuccessResponse)
def accept_parent_invite(payload: AcceptInviteRequest, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request, key="accept_invite")
    record = otp_service.verify_otp(db, payload.email, payload.code, "parent_invite")
    parent = db.query(Parent).filter(Parent.email == payload.email.lower()).first()
    activated_now = False
    if parent:
        activated_now = not parent.is_active
        parent.is_active = True
        db.commit()
        db.refresh(parent)
    otp_service.consume_otp(db, record)

    # Event notification: invitation accepted -> notify the child(ren) & the parent
    from app.services import notification as notif_service
    if parent is not None and activated_now:
        notif_service.notify_all_children(
            db, parent.family_id, type="parent_joined",
            title="Parent joined the family",
            message=f"{parent.first_name} {parent.last_name} has joined your family.",
            category="system",
            dedup_key=f"parent_joined:{parent.id}",
        )
        # confirm completion to the parent as well (in-app)
        notif_service.push_parent(
            db, parent, type="invitation_accepted",
            title="Welcome to Parently",
            message="Your invitation has been accepted. Your family can now see your check-ins.",
            category="system",
            dedup_key=f"invite_accepted:{parent.id}",
        )
    return SuccessResponse(success=True)


@router.post("/me/siblings/invite", response_model=SiblingInviteOut)
def invite_sibling(
    payload: SiblingInviteRequest,
    request: Request,
    db: Session = Depends(get_db),
    user_or_parent: User | Parent = Depends(get_current_user_or_parent),
):
    check_rate_limit(request, key="sibling_invite")
    if isinstance(user_or_parent, User):
        user_id = user_or_parent.id
    else:
        user_id = None
    record = otp_service.issue_otp(db, payload.email, "email_verification")
    otp_service.deliver(record, "email_verification")
    return SiblingInviteOut(email=payload.email, status="pending", invited_at=record.created_at.isoformat())


@router.post("/parents/{parent_id}/invite/resend", response_model=SiblingInviteOut)
def resend_parent_invite(parent_id: str, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request, key="parent_invite")
    parent = db.get(Parent, parent_id)
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")
    record = otp_service.issue_otp(db, parent.email, "parent_invite")
    otp_service.deliver(record, "parent_invite")
    return SiblingInviteOut(email=parent.email, status="pending", invited_at=record.created_at.isoformat())


@router.get("/me/siblings/invites", response_model=list[SiblingInviteOut])
def get_sibling_invites(
    user_or_parent: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    records = (
        db.query(OTPCode)
        .filter(OTPCode.purpose == "email_verification")
        .all()
    )
    return [SiblingInviteOut(email=r.email, status="pending", invited_at=r.created_at.isoformat()) for r in records]