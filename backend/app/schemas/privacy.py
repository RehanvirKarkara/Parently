"""Pydantic schemas for Privacy, Consent, Authorizations, and Data Management."""
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PolicyVersionOut(BaseModel):
    policy_type: str
    version: str
    effective_date: str
    title: str
    summary: str
    url: str
    is_required: bool = True


class ThirdPartyServiceOut(BaseModel):
    name: str
    provider: str
    category: str
    purpose: str
    data_involved: str
    storage_retention: str
    is_active: bool = True


class PoliciesResponse(BaseModel):
    policies: list[PolicyVersionOut]
    third_party_services: list[ThirdPartyServiceOut]
    privacy_contact: dict[str, str]


class ConsentItemOut(ORMModel):
    id: str
    consent_type: str
    policy_version: str
    status: str
    granted_at: datetime
    revoked_at: datetime | None = None
    metadata_json: dict[str, Any] | None = None


class ConsentStatusResponse(BaseModel):
    consents: list[ConsentItemOut]
    active_types: list[str]
    missing_required: list[str]


class GrantConsentRequest(BaseModel):
    consent_type: str = Field(..., description="terms, privacy_policy, health_data_processing, ai_processing, marketing")
    policy_version: str = Field(default="v1.0")
    metadata_json: dict[str, Any] | None = None


class WithdrawConsentRequest(BaseModel):
    consent_type: str = Field(..., description="e.g. ai_processing, marketing")
    reason: str | None = None


class ParentAuthorizationOut(ORMModel):
    id: str
    parent_id: str
    family_id: str
    authorized_scopes: list[str]
    status: str
    granted_at: datetime
    revoked_at: datetime | None = None
    notes: str | None = None


class UpdateParentAuthorizationRequest(BaseModel):
    authorized_scopes: list[str] = Field(default=["checkins", "medications", "vitals", "reports", "ai_summaries"])
    status: str = Field(default="active", pattern="active|revoked")


class DataExportResponse(BaseModel):
    export_id: str
    generated_at: datetime
    export_version: str = "1.0"
    user_profile: dict[str, Any] | None = None
    parent_profile: dict[str, Any] | None = None
    family_memberships: list[dict[str, Any]] = []
    health_logs: list[dict[str, Any]] = []
    medicines: list[dict[str, Any]] = []
    reports: list[dict[str, Any]] = []
    notifications: list[dict[str, Any]] = []
    consent_history: list[dict[str, Any]] = []
    parent_authorizations: list[dict[str, Any]] = []


class DeleteDataRequest(BaseModel):
    password: str
    delete_scope: str = Field(
        default="health_and_activity",
        description="health_and_activity | notifications | all_records",
    )


class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: str = Field(..., description="Must match 'DELETE'")
