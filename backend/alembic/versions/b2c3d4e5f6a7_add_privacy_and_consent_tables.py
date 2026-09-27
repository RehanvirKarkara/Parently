"""add privacy, consent, authorizations and audit tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-27 16:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. user_consents table
    op.create_table(
        "user_consents",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("parent_id", sa.String(length=36), sa.ForeignKey("parents.id", ondelete="CASCADE"), nullable=True),
        sa.Column("consent_type", sa.String(length=60), nullable=False),
        sa.Column("policy_version", sa.String(length=20), nullable=False, server_default="v1.0"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="granted"),
        sa.Column("granted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_user_consents_user_id"), "user_consents", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_consents_parent_id"), "user_consents", ["parent_id"], unique=False)
    op.create_index(op.f("ix_user_consents_consent_type"), "user_consents", ["consent_type"], unique=False)

    # 2. parent_authorizations table
    op.create_table(
        "parent_authorizations",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("parent_id", sa.String(length=36), sa.ForeignKey("parents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("family_id", sa.String(length=36), sa.ForeignKey("families.id", ondelete="CASCADE"), nullable=False),
        sa.Column("authorized_scopes", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("granted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_parent_authorizations_parent_id"), "parent_authorizations", ["parent_id"], unique=False)
    op.create_index(op.f("ix_parent_authorizations_family_id"), "parent_authorizations", ["family_id"], unique=False)

    # 3. privacy_requests table
    op.create_table(
        "privacy_requests",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("parent_id", sa.String(length=36), sa.ForeignKey("parents.id", ondelete="CASCADE"), nullable=True),
        sa.Column("request_type", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_privacy_requests_user_id"), "privacy_requests", ["user_id"], unique=False)
    op.create_index(op.f("ix_privacy_requests_parent_id"), "privacy_requests", ["parent_id"], unique=False)

    # 4. privacy_audit_logs table
    op.create_table(
        "privacy_audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("actor_id", sa.String(length=36), nullable=False),
        sa.Column("actor_type", sa.String(length=20), nullable=False),
        sa.Column("action", sa.String(length=60), nullable=False),
        sa.Column("resource_type", sa.String(length=50), nullable=True),
        sa.Column("resource_id", sa.String(length=36), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("details_json", sa.JSON(), nullable=True),
    )
    op.create_index(op.f("ix_privacy_audit_logs_actor_id"), "privacy_audit_logs", ["actor_id"], unique=False)
    op.create_index(op.f("ix_privacy_audit_logs_action"), "privacy_audit_logs", ["action"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_privacy_audit_logs_action"), table_name="privacy_audit_logs")
    op.drop_index(op.f("ix_privacy_audit_logs_actor_id"), table_name="privacy_audit_logs")
    op.drop_table("privacy_audit_logs")

    op.drop_index(op.f("ix_privacy_requests_parent_id"), table_name="privacy_requests")
    op.drop_index(op.f("ix_privacy_requests_user_id"), table_name="privacy_requests")
    op.drop_table("privacy_requests")

    op.drop_index(op.f("ix_parent_authorizations_family_id"), table_name="parent_authorizations")
    op.drop_index(op.f("ix_parent_authorizations_parent_id"), table_name="parent_authorizations")
    op.drop_table("parent_authorizations")

    op.drop_index(op.f("ix_user_consents_consent_type"), table_name="user_consents")
    op.drop_index(op.f("ix_user_consents_parent_id"), table_name="user_consents")
    op.drop_index(op.f("ix_user_consents_user_id"), table_name="user_consents")
    op.drop_table("user_consents")
