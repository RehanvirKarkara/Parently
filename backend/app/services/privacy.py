"""Privacy, Consent, Data Management, and Compliance Audit Service."""
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password
from app.models import (
    AIConversation,
    Family,
    FamilyMember,
    HealthLog,
    Medicine,
    Notification,
    Parent,
    ParentAuthorization,
    PrivacyAuditLog,
    PrivacyRequest,
    Report,
    User,
    UserConsent,
)

logger = logging.getLogger(__name__)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def record_audit(
    db: Session,
    actor_id: str,
    actor_type: str,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> PrivacyAuditLog:
    """Record an audit trail entry for privacy, consent, or data-management actions."""
    log = PrivacyAuditLog(
        actor_id=actor_id,
        actor_type=actor_type,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        timestamp=utcnow(),
        details_json=details or {},
    )
    db.add(log)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Failed to commit privacy audit log: %s", e)
    return log


def get_policy_registry() -> list[dict[str, Any]]:
    return [
        {
            "policy_type": "terms",
            "version": "v1.0",
            "effective_date": "2026-09-27",
            "title": "Terms of Service",
            "summary": "Governs access, family accounts, member obligations, acceptable use, and platform limitations.",
            "url": "/terms",
            "is_required": True,
        },
        {
            "policy_type": "privacy_policy",
            "version": "v1.0",
            "effective_date": "2026-09-27",
            "title": "Privacy Policy",
            "summary": "Explains information collected, health records storage, third-party processors, retention, and user privacy rights.",
            "url": "/privacy-policy",
            "is_required": True,
        },
        {
            "policy_type": "medical_disclaimer",
            "version": "v1.0",
            "effective_date": "2026-09-27",
            "title": "Medical & Clinical Disclaimer",
            "summary": "Parently is a care-support tool, not a diagnostic platform or emergency service. Always consult licensed medical providers.",
            "url": "/medical-disclaimer",
            "is_required": True,
        },
        {
            "policy_type": "ai_data_processing",
            "version": "v1.0",
            "effective_date": "2026-09-27",
            "title": "AI & Data Processing Disclosure",
            "summary": "Transparency on how AI models (Groq LLM, Nomic embeddings, ChromaDB RAG) summarize check-ins and suggest routine prompts.",
            "url": "/ai-data-processing",
            "is_required": False,
        },
        {
            "policy_type": "cookie_policy",
            "version": "v1.0",
            "effective_date": "2026-09-27",
            "title": "Cookie & Local Storage Policy",
            "summary": "Details strictly necessary client-side storage (JWT tokens, theme, calendar view) with zero third-party advertising cookies.",
            "url": "/cookie-policy",
            "is_required": False,
        },
    ]


def get_third_party_services() -> list[dict[str, Any]]:
    return [
        {
            "name": "Groq LLM Inference API",
            "provider": "Groq, Inc.",
            "category": "Artificial Intelligence / LLM",
            "purpose": "Processes care assistant conversations and health summary queries using configured open models (Llama 3.3 / Qwen).",
            "data_involved": "Sanitized conversational user queries and relevant health check-in snippets strictly needed for the prompt.",
            "storage_retention": "Ephemerally processed per API call. No persistent training on customer data.",
            "is_active": bool(settings.GROQ_API_KEY),
        },
        {
            "name": "ChromaDB & Nomic Embeddings",
            "provider": "Parently Local Instance / Nomic AI",
            "category": "Vector Database & Semantic Search",
            "purpose": "Stores semantic embeddings of parent health check-ins and notes for contextual retrieval (RAG).",
            "data_involved": "Anonymized text segments of health logs, daily check-ins, and activity logs.",
            "storage_retention": "Persisted within application's secure vector storage; deleted upon data export/deletion request.",
            "is_active": True,
        },
        {
            "name": "Brevo (Sendinblue) SMTP",
            "provider": "Brevo SAS",
            "category": "Transactional Email",
            "purpose": "Dispatches one-time verification passwords (OTP), password resets, and family invitations.",
            "data_involved": "Recipient email address and 6-digit OTP code.",
            "storage_retention": "Transient delivery logs maintained per email provider security standards.",
            "is_active": bool(settings.SMTP_USERNAME),
        },
        {
            "name": "Upstash Redis",
            "provider": "Upstash Inc.",
            "category": "Message Broker & Rate Limiting",
            "purpose": "Manages asynchronous Celery task scheduling (reminders, report generation) and API rate limiting.",
            "data_involved": "Task IDs, transient reminder metadata, IP/email hashes for rate limiting.",
            "storage_retention": "Temporary key expiration with automatic TTL eviction.",
            "is_active": bool(settings.REDIS_URL),
        },
        {
            "name": "Firebase Cloud Messaging (FCM)",
            "provider": "Google LLC",
            "category": "Push Notification Service",
            "purpose": "Delivers browser push notifications for medication reminders, daily check-in alerts, and family updates.",
            "data_involved": "Device registration push tokens, notification titles and body snippets.",
            "storage_retention": "Device token stored until user logs out or revokes notification permission.",
            "is_active": True,
        },
        {
            "name": "Browser LocalStorage",
            "provider": "User Browser (Local)",
            "category": "Client Storage",
            "purpose": "Maintains user authentication session tokens (JWT access & refresh tokens) and UI preferences (theme, calendar view).",
            "data_involved": "Auth session token, UI preferences.",
            "storage_retention": "Cleared upon sign-out or via browser cache deletion.",
            "is_active": True,
        },
    ]


def get_privacy_contact_info() -> dict[str, str]:
    return {
        "contact_email": getattr(settings, "SUPPORT_EMAIL", "privacy@parently.app"),
        "contact_role": "Data Privacy & Governance Team",
        "turnaround_time": "30 business days or as prescribed by applicable regulations",
        "note": "For questions, data export, or formal privacy requests, contact us using the verified email on your account.",
    }


def get_user_consents(db: Session, actor: User | Parent) -> list[UserConsent]:
    is_parent = isinstance(actor, Parent)
    query = db.query(UserConsent)
    if is_parent:
        query = query.filter(UserConsent.parent_id == actor.id)
    else:
        query = query.filter(UserConsent.user_id == actor.id)
    return query.order_by(UserConsent.created_at.desc()).all()


def grant_consent(
    db: Session,
    actor: User | Parent,
    consent_type: str,
    policy_version: str = "v1.0",
    request: Request | None = None,
    metadata_json: dict[str, Any] | None = None,
) -> UserConsent:
    is_parent = isinstance(actor, Parent)
    user_id = None if is_parent else actor.id
    parent_id = actor.id if is_parent else None
    actor_type = "parent" if is_parent else "user"

    ip_address = None
    user_agent = None
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    # Find existing consent
    existing = (
        db.query(UserConsent)
        .filter(
            UserConsent.parent_id == parent_id if is_parent else UserConsent.user_id == user_id,
            UserConsent.consent_type == consent_type,
        )
        .first()
    )

    if existing:
        existing.policy_version = policy_version
        existing.status = "granted"
        existing.granted_at = utcnow()
        existing.revoked_at = None
        existing.ip_address = ip_address
        existing.user_agent = user_agent
        if metadata_json:
            existing.metadata_json = metadata_json
        consent_record = existing
    else:
        consent_record = UserConsent(
            user_id=user_id,
            parent_id=parent_id,
            consent_type=consent_type,
            policy_version=policy_version,
            status="granted",
            granted_at=utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata_json or {},
        )
        db.add(consent_record)

    db.commit()
    db.refresh(consent_record)

    record_audit(
        db,
        actor_id=actor.id,
        actor_type=actor_type,
        action="consent_granted",
        resource_type="user_consent",
        resource_id=consent_record.id,
        details={"consent_type": consent_type, "policy_version": policy_version},
    )
    return consent_record


def withdraw_consent(
    db: Session,
    actor: User | Parent,
    consent_type: str,
    reason: str | None = None,
) -> UserConsent:
    is_parent = isinstance(actor, Parent)
    actor_type = "parent" if is_parent else "user"

    consent_record = (
        db.query(UserConsent)
        .filter(
            UserConsent.parent_id == actor.id if is_parent else UserConsent.user_id == actor.id,
            UserConsent.consent_type == consent_type,
        )
        .first()
    )

    if not consent_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No consent record found for '{consent_type}'.",
        )

    consent_record.status = "revoked"
    consent_record.revoked_at = utcnow()
    if reason:
        current_meta = consent_record.metadata_json or {}
        current_meta["withdrawal_reason"] = reason
        consent_record.metadata_json = current_meta

    db.commit()
    db.refresh(consent_record)

    record_audit(
        db,
        actor_id=actor.id,
        actor_type=actor_type,
        action="consent_withdrawn",
        resource_type="user_consent",
        resource_id=consent_record.id,
        details={"consent_type": consent_type, "reason": reason},
    )
    return consent_record


def export_user_data(db: Session, actor: User | Parent) -> dict[str, Any]:
    """Generates structured personal data export for the authenticated user or parent."""
    is_parent = isinstance(actor, Parent)
    export_id = f"export_{actor.id[:8]}_{int(utcnow().timestamp())}"

    export_payload: dict[str, Any] = {
        "export_id": export_id,
        "generated_at": utcnow().isoformat(),
        "export_version": "1.0",
        "actor_type": "parent" if is_parent else "user",
        "user_profile": None,
        "parent_profile": None,
        "family_memberships": [],
        "health_logs": [],
        "medicines": [],
        "reports": [],
        "notifications": [],
        "consent_history": [],
        "parent_authorizations": [],
    }

    if not is_parent:
        user: User = actor  # type: ignore
        export_payload["user_profile"] = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "avatar_color": getattr(user, "avatar_color", None),
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }

        # Family memberships
        memberships = (
            db.query(FamilyMember)
            .filter(FamilyMember.user_id == user.id, FamilyMember.is_active == True)
            .all()
        )
        for m in memberships:
            fam = db.query(Family).filter(Family.id == m.family_id).first()
            export_payload["family_memberships"].append({
                "family_id": m.family_id,
                "family_name": fam.name if fam else "Family",
                "role": m.role,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            })

        # Notifications
        notifs = db.query(Notification).filter(Notification.recipient_user_id == user.id).all()
        export_payload["notifications"] = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "category": n.category,
                "type": n.type,
                "sent_at": n.sent_at.isoformat() if n.sent_at else None,
            }
            for n in notifs
        ]
    else:
        parent: Parent = actor  # type: ignore
        export_payload["parent_profile"] = {
            "id": parent.id,
            "email": parent.email,
            "first_name": parent.first_name,
            "last_name": parent.last_name,
            "date_of_birth": parent.date_of_birth.isoformat() if parent.date_of_birth else None,
            "medical_conditions": parent.medical_conditions,
            "allergies": parent.allergies,
            "phone": parent.phone,
            "address": parent.address,
            "blood_group": parent.blood_group,
            "created_at": parent.created_at.isoformat() if parent.created_at else None,
        }

        # Health logs
        logs = db.query(HealthLog).filter(HealthLog.parent_id == parent.id).all()
        export_payload["health_logs"] = [
            {
                "id": l.id,
                "log_date": l.log_date.isoformat() if l.log_date else None,
                "log_time_of_day": l.log_time_of_day,
                "hours_slept": float(l.hours_slept) if l.hours_slept is not None else None,
                "meds_taken": l.meds_taken,
                "day_rating": l.day_rating,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ]

        # Medicines
        meds = db.query(Medicine).filter(Medicine.parent_id == parent.id).all()
        export_payload["medicines"] = [
            {
                "id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "instructions": m.instructions,
                "is_active": m.is_active,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in meds
        ]

        # Reports
        reps = db.query(Report).filter(Report.family_id == parent.family_id).all()
        export_payload["reports"] = [
            {
                "id": r.id,
                "report_type": r.report_type,
                "period_start": r.report_period_start.isoformat() if r.report_period_start else None,
                "period_end": r.report_period_end.isoformat() if r.report_period_end else None,
                "content": r.content,
                "generated_at": r.generated_at.isoformat() if r.generated_at else None,
            }
            for r in reps
        ]

        # Notifications
        notifs = db.query(Notification).filter(Notification.recipient_parent_id == parent.id).all()
        export_payload["notifications"] = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "category": n.category,
                "type": n.type,
                "sent_at": n.sent_at.isoformat() if n.sent_at else None,
            }
            for n in notifs
        ]

        # Authorizations
        auths = (
            db.query(ParentAuthorization)
            .filter(ParentAuthorization.parent_id == parent.id)
            .all()
        )
        export_payload["parent_authorizations"] = [
            {
                "id": a.id,
                "family_id": a.family_id,
                "scopes": a.authorized_scopes,
                "status": a.status,
                "granted_at": a.granted_at.isoformat() if a.granted_at else None,
                "revoked_at": a.revoked_at.isoformat() if a.revoked_at else None,
            }
            for a in auths
        ]

    # Consents
    consents = get_user_consents(db, actor)
    export_payload["consent_history"] = [
        {
            "id": c.id,
            "consent_type": c.consent_type,
            "policy_version": c.policy_version,
            "status": c.status,
            "granted_at": c.granted_at.isoformat() if c.granted_at else None,
            "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
        }
        for c in consents
    ]

    # Record request & audit
    req = PrivacyRequest(
        user_id=None if is_parent else actor.id,
        parent_id=actor.id if is_parent else None,
        request_type="export_data",
        status="completed",
        requested_at=utcnow(),
        completed_at=utcnow(),
        result_json={"export_id": export_id, "categories_included": list(export_payload.keys())},
    )
    db.add(req)
    db.commit()

    record_audit(
        db,
        actor_id=actor.id,
        actor_type="parent" if is_parent else "user",
        action="data_export_completed",
        resource_type="privacy_request",
        resource_id=req.id,
        details={"export_id": export_id},
    )

    return export_payload


def delete_user_data(
    db: Session,
    actor: User | Parent,
    password: str,
    delete_scope: str,
) -> dict[str, Any]:
    """Selective data deletion (e.g. health checkins, notifications, logs) without closing account."""
    is_parent = isinstance(actor, Parent)
    actor_type = "parent" if is_parent else "user"

    # Verify password for security
    if not actor.hashed_password or not verify_password(password, actor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Re-authentication is required to delete data.",
        )

    deleted_counts: dict[str, int] = {}

    if is_parent:
        parent: Parent = actor  # type: ignore
        if delete_scope in ("health_and_activity", "all_records"):
            hl_count = db.query(HealthLog).filter(HealthLog.parent_id == parent.id).delete()
            rep_count = db.query(Report).filter(Report.family_id == parent.family_id).delete()
            deleted_counts["health_logs"] = hl_count
            deleted_counts["reports"] = rep_count

        if delete_scope in ("notifications", "all_records"):
            notif_count = (
                db.query(Notification).filter(Notification.recipient_parent_id == parent.id).delete()
            )
            deleted_counts["notifications"] = notif_count

        if delete_scope == "all_records":
            med_count = db.query(Medicine).filter(Medicine.parent_id == parent.id).delete()
            deleted_counts["medicines"] = med_count
    else:
        user: User = actor  # type: ignore
        if delete_scope in ("notifications", "all_records"):
            notif_count = db.query(Notification).filter(Notification.recipient_user_id == user.id).delete()
            deleted_counts["notifications"] = notif_count

    req = PrivacyRequest(
        user_id=None if is_parent else actor.id,
        parent_id=actor.id if is_parent else None,
        request_type="delete_data",
        status="completed",
        requested_at=utcnow(),
        completed_at=utcnow(),
        result_json={"scope": delete_scope, "deleted_counts": deleted_counts},
    )
    db.add(req)
    db.commit()

    record_audit(
        db,
        actor_id=actor.id,
        actor_type=actor_type,
        action="data_deletion_completed",
        resource_type="privacy_request",
        resource_id=req.id,
        details={"scope": delete_scope, "counts": deleted_counts},
    )

    return {"success": True, "scope": delete_scope, "deleted_records": deleted_counts}


def delete_user_account(
    db: Session,
    actor: User | Parent,
    password: str,
    confirmation: str,
) -> dict[str, Any]:
    """Completely deletes user account, cascading personal data, and handling family ownership safely."""
    if confirmation.strip() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation string must be 'DELETE'.",
        )

    # Re-authenticate
    if not actor.hashed_password or not verify_password(password, actor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Account deletion requires valid re-authentication.",
        )

    is_parent = isinstance(actor, Parent)
    actor_id = actor.id
    actor_type = "parent" if is_parent else "user"

    # Pre-audit log before deleting user record
    record_audit(
        db,
        actor_id=actor_id,
        actor_type=actor_type,
        action="account_deletion_initiated",
        resource_type=actor_type,
        resource_id=actor_id,
        details={"timestamp": utcnow().isoformat()},
    )

    if is_parent:
        # Delete parent records
        db.query(HealthLog).filter(HealthLog.parent_id == actor_id).delete()
        db.query(Medicine).filter(Medicine.parent_id == actor_id).delete()
        db.query(Report).filter(Report.family_id == actor.family_id).delete()
        db.query(Notification).filter(Notification.recipient_parent_id == actor_id).delete()
        db.query(ParentAuthorization).filter(ParentAuthorization.parent_id == actor_id).delete()
        db.query(UserConsent).filter(UserConsent.parent_id == actor_id).delete()
        db.query(PrivacyRequest).filter(PrivacyRequest.parent_id == actor_id).delete()
        db.delete(actor)
        db.commit()
    else:
        user: User = actor  # type: ignore
        # Handle families where this user is creator
        owned_families = db.query(Family).filter(Family.created_by_user_id == user.id).all()
        for family in owned_families:
            # Check other members
            other_members = (
                db.query(FamilyMember)
                .filter(FamilyMember.family_id == family.id, FamilyMember.user_id != user.id)
                .all()
            )
            if not other_members:
                # Sole owner with no other adult members: clean up associated parents and family
                # Clean up parent authorizations, health logs, medicines, reports for parents under family
                parents = db.query(Parent).filter(Parent.family_id == family.id).all()
                for p in parents:
                    db.query(HealthLog).filter(HealthLog.parent_id == p.id).delete()
                    db.query(Medicine).filter(Medicine.parent_id == p.id).delete()
                    db.query(Report).filter(Report.family_id == family.id).delete()
                    db.query(Notification).filter(Notification.recipient_parent_id == p.id).delete()
                    db.query(ParentAuthorization).filter(ParentAuthorization.parent_id == p.id).delete()
                    db.query(UserConsent).filter(UserConsent.parent_id == p.id).delete()
                    db.delete(p)
                db.query(FamilyMember).filter(FamilyMember.family_id == family.id).delete()
                db.delete(family)
            else:
                # Reassign ownership to next active member
                next_owner = other_members[0]
                next_owner.role = "creator"
                family.created_by_user_id = next_owner.user_id

        # Delete memberships, notifications, AI conversations, consents, and user
        db.query(FamilyMember).filter(FamilyMember.user_id == user.id).delete()
        db.query(Notification).filter(Notification.recipient_user_id == user.id).delete()
        db.query(AIConversation).filter(AIConversation.user_id == user.id).delete()
        db.query(UserConsent).filter(UserConsent.user_id == user.id).delete()
        db.query(PrivacyRequest).filter(PrivacyRequest.user_id == user.id).delete()
        db.delete(user)
        db.commit()

    return {"success": True, "message": "Account and associated personal records have been permanently deleted."}


def get_parent_authorizations(db: Session, parent: Parent) -> list[ParentAuthorization]:
    return (
        db.query(ParentAuthorization)
        .filter(ParentAuthorization.parent_id == parent.id)
        .order_by(ParentAuthorization.created_at.desc())
        .all()
    )


def update_parent_authorization(
    db: Session,
    parent: Parent,
    family_id: str,
    scopes: list[str],
    status_str: str = "active",
) -> ParentAuthorization:
    auth = (
        db.query(ParentAuthorization)
        .filter(
            ParentAuthorization.parent_id == parent.id,
            ParentAuthorization.family_id == family_id,
        )
        .first()
    )

    if not auth:
        auth = ParentAuthorization(
            parent_id=parent.id,
            family_id=family_id,
            authorized_scopes=scopes,
            status=status_str,
            granted_at=utcnow(),
        )
        db.add(auth)
    else:
        auth.authorized_scopes = scopes
        auth.status = status_str
        if status_str == "revoked":
            auth.revoked_at = utcnow()
        else:
            auth.revoked_at = None

    db.commit()
    db.refresh(auth)

    record_audit(
        db,
        actor_id=parent.id,
        actor_type="parent",
        action="parent_authorization_updated",
        resource_type="parent_authorization",
        resource_id=auth.id,
        details={"family_id": family_id, "scopes": scopes, "status": status_str},
    )
    return auth
