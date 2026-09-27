from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent
from app.core.ratelimit import check_rate_limit, is_locked, record_failure, record_success
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import Family, FamilyMember, OTPCode, Parent, User
from app.schemas import (
    AuthResponse,
    LoginRequest,
    OtpRequest,
    OtpResponse,
    OtpVerifyRequest,
    ParentActivateRequest,
    ParentActivateResult,
    ParentRegisterRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    SuccessResponse,
    TokenPair,
)
from app.schemas.common import ParentOut, UserOut
from app.services import otp as otp_service
from app.services import email as email_service
from app.core.deps import get_authenticated_parent

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    check_rate_limit(request, key="register")
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    family = Family(name=f"{user.first_name or 'User'}'s Family", created_by_user_id=user.id)
    db.add(family)
    db.commit()
    db.refresh(family)
    membership = FamilyMember(
        family_id=family.id,
        user_id=user.id,
        role="creator",
        joined_at=user.created_at,
        is_active=True,
    )
    db.add(membership)
    db.commit()
    tokens = TokenPair(
        access_token=create_access_token(user.id, kind="user"),
        refresh_token=create_refresh_token(user.id, kind="user"),
    )

    # Record explicit user consents
    from app.services import privacy as privacy_service
    if payload.agree_terms:
        privacy_service.grant_consent(db, user, "terms", payload.policy_version, request=request)
    if payload.agree_privacy:
        privacy_service.grant_consent(db, user, "privacy_policy", payload.policy_version, request=request)
    if payload.agree_health_processing:
        privacy_service.grant_consent(db, user, "health_data_processing", payload.policy_version, request=request)
    if payload.opt_in_marketing:
        privacy_service.grant_consent(db, user, "marketing", payload.policy_version, request=request)

    return AuthResponse(user=user, tokens=tokens, mode="offspring")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    check_rate_limit(request, key="login")
    is_locked(payload.email)
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user and user.hashed_password and verify_password(payload.password, user.hashed_password):
        record_success(payload.email)
        tokens = TokenPair(
            access_token=create_access_token(user.id, kind="user"),
            refresh_token=create_refresh_token(user.id, kind="user"),
        )
        return AuthResponse(user=user, tokens=tokens, mode="offspring")

    parent = db.query(Parent).filter(Parent.email == payload.email.lower()).first()
    if parent and parent.hashed_password and verify_password(payload.password, parent.hashed_password):
        record_success(payload.email)
        tokens = TokenPair(
            access_token=create_access_token(parent.id, kind="parent"),
            refresh_token=create_refresh_token(parent.id, kind="parent"),
        )
        return AuthResponse(user=parent, tokens=tokens, mode="parent", parent_id=parent.id)

    record_failure(payload.email)
    raise HTTPException(status_code=401, detail="Invalid email or password.")


@router.post("/refresh", response_model=TokenPair)
def refresh_token(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)) -> TokenPair:
    check_rate_limit(request, key="refresh")
    payload_data = decode_token(payload.refresh_token, "refresh")
    if payload_data is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    subject = payload_data["sub"]
    kind = payload_data.get("kind", "user")
    return TokenPair(
        access_token=create_access_token(subject, kind=kind),
        refresh_token=create_refresh_token(subject, kind=kind),
    )


@router.post("/parent/register", response_model=AuthResponse)
def register_parent(payload: ParentRegisterRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    check_rate_limit(request, key="register")
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in with that account.")
    parent = db.query(Parent).filter(Parent.email == email).first()
    if parent is None:
        raise HTTPException(status_code=404, detail="This email was not invited. Please login using the email address that received the invitation.")
    if parent.is_active:
        raise HTTPException(status_code=409, detail="This invitation has already been completed. Please sign in.")
    if parent.hashed_password:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")
    parent.hashed_password = hash_password(payload.password)
    db.commit()
    db.refresh(parent)
    tokens = TokenPair(
        access_token=create_access_token(parent.id, kind="parent"),
        refresh_token=create_refresh_token(parent.id, kind="parent"),
    )
    return AuthResponse(user=parent, tokens=tokens, mode="parent", parent_id=parent.id)


@router.post("/parent/activate", response_model=ParentActivateResult)
def activate_parent_invitation(
    payload: ParentActivateRequest,
    request: Request,
    parent: Parent = Depends(get_authenticated_parent),
    db: Session = Depends(get_db),
) -> ParentActivateResult:
    check_rate_limit(request, key="accept_invite")
    if parent.is_active:
        return ParentActivateResult(success=True, already_active=True)
    record = otp_service.verify_otp(db, parent.email, payload.code, "parent_invite")
    was_pending = not parent.is_active
    parent.is_active = True
    db.commit()
    otp_service.consume_otp(db, record)

    # Event notification: parent completed onboarding -> notify child(ren) and the parent
    if was_pending:
        from app.services import notification as notif_service
        notif_service.notify_all_children(
            db, parent.family_id, type="parent_joined",
            title="Parent joined the family",
            message=f"{parent.first_name} {parent.last_name} has joined your family.",
            category="system", dedup_key=f"parent_joined:{parent.id}",
        )
        notif_service.push_parent(
            db, parent, type="invitation_accepted",
            title="Welcome to Parently",
            message="Your invitation has been accepted. Your family can now see your check-ins.",
            category="system", dedup_key=f"invite_accepted:{parent.id}",
        )
    # Record parent consents and explicit data sharing authorization
    from app.services import privacy as privacy_service
    scopes = payload.authorized_scopes or ["checkins", "medications", "vitals", "reports", "ai_summaries"]
    privacy_service.update_parent_authorization(db, parent, parent.family_id, scopes, "active")
    if payload.agree_terms:
        privacy_service.grant_consent(db, parent, "terms", payload.policy_version, request=request)
    if payload.agree_privacy:
        privacy_service.grant_consent(db, parent, "privacy_policy", payload.policy_version, request=request)
    privacy_service.grant_consent(
        db,
        parent,
        "parent_data_sharing",
        payload.policy_version,
        request=request,
        metadata_json={"scopes": scopes, "family_id": parent.family_id},
    )

    return ParentActivateResult(success=True)


@router.post("/otp/request", response_model=OtpResponse)
def request_otp(payload: OtpRequest, request: Request, db: Session = Depends(get_db)) -> OtpResponse:
    check_rate_limit(request, key=f"otp:{payload.purpose}")
    record = otp_service.issue_otp(db, payload.email, payload.purpose)
    result = otp_service.deliver(record, payload.purpose)
    return OtpResponse(success=True, dev_code=result.get("dev_code"))


@router.post("/otp/verify", response_model=SuccessResponse)
def verify_otp(payload: OtpVerifyRequest, db: Session = Depends(get_db)) -> SuccessResponse:
    record = otp_service.verify_otp(db, payload.email, payload.code, payload.purpose)
    if payload.purpose == "email_verification":
        user = db.query(User).filter(User.email == payload.email.lower()).first()
        if user is not None:
            user.is_verified = True
    # For password_reset, do not consume yet — let /password-reset verify and consume it upon final change
    if payload.purpose != "password_reset":
        otp_service.consume_otp(db, record)
    return SuccessResponse(success=True)


@router.post("/password-reset/request", response_model=OtpResponse)
def request_password_reset(payload: PasswordResetRequest, request: Request, db: Session = Depends(get_db)) -> OtpResponse:
    check_rate_limit(request, key="password_reset")
    record = otp_service.issue_otp(db, payload.email, "password_reset")
    result = otp_service.deliver(record, "password_reset")
    return OtpResponse(success=True, dev_code=result.get("dev_code"))


@router.post("/password-reset", response_model=SuccessResponse)
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)) -> SuccessResponse:
    record = otp_service.verify_otp(db, payload.email, payload.code, "password_reset")
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        parent = db.query(Parent).filter(Parent.email == payload.email.lower()).first()
        if parent:
            parent.hashed_password = hash_password(payload.new_password)
            db.commit()
            otp_service.consume_otp(db, record)
            return SuccessResponse(success=True)
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    otp_service.consume_otp(db, record)
    return SuccessResponse(success=True)


@router.get("/me", response_model=ParentOut | UserOut)
def get_me(user_or_parent: User | Parent = Depends(get_current_user_or_parent)):
    return user_or_parent