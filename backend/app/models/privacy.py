"""Privacy, Consent, Data Management, and Compliance Audit Models."""
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin, utcnow


class UserConsent(UUIDMixin, TimestampMixin, Base):
    """Immutable/versioned consent ledger recording explicit user agreements."""
    __tablename__ = "user_consents"

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("parents.id", ondelete="CASCADE"), index=True, nullable=True
    )
    consent_type: Mapped[str] = mapped_column(
        String(60), index=True, nullable=False
    )  # terms, privacy_policy, health_data_processing, ai_processing, marketing, parent_data_sharing
    policy_version: Mapped[str] = mapped_column(String(20), nullable=False, default="v1.0")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="granted")  # granted, revoked
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class ParentAuthorization(UUIDMixin, TimestampMixin, Base):
    """Explicit data-sharing authorization granted by an adult parent to a family."""
    __tablename__ = "parent_authorizations"

    parent_id: Mapped[str] = mapped_column(
        ForeignKey("parents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    family_id: Mapped[str] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), index=True, nullable=False
    )
    authorized_scopes: Mapped[list] = mapped_column(
        JSON, nullable=False, default=lambda: ["checkins", "medications", "vitals", "reports", "ai_summaries"]
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # active, revoked, pending
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class PrivacyRequest(UUIDMixin, TimestampMixin, Base):
    """Tracks personal data export, deletion, and account erasure requests."""
    __tablename__ = "privacy_requests"

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("parents.id", ondelete="CASCADE"), index=True, nullable=True
    )
    request_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # export_data, delete_data, delete_account
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, completed, failed
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    result_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class PrivacyAuditLog(UUIDMixin, Base):
    """Audit trail for privacy-critical actions without logging raw health metrics."""
    __tablename__ = "privacy_audit_logs"

    actor_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    actor_type: Mapped[str] = mapped_column(String(20), nullable=False)  # user, parent, system
    action: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    details_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
