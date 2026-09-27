"""Privacy, Consent, Policies, Data Export & Deletion Endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_authenticated_parent, get_current_user_or_parent
from app.models import Parent, User
from app.schemas.privacy import (
    ConsentItemOut,
    ConsentStatusResponse,
    DataExportResponse,
    DeleteAccountRequest,
    DeleteDataRequest,
    GrantConsentRequest,
    ParentAuthorizationOut,
    PoliciesResponse,
    PolicyVersionOut,
    ThirdPartyServiceOut,
    UpdateParentAuthorizationRequest,
    WithdrawConsentRequest,
)
from app.services import privacy as privacy_service

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.get("/policies", response_model=PoliciesResponse)
def get_policies() -> PoliciesResponse:
    """Public endpoint returning active legal policies, real third-party processors, and privacy contact."""
    policies = [PolicyVersionOut(**p) for p in privacy_service.get_policy_registry()]
    services = [ThirdPartyServiceOut(**s) for s in privacy_service.get_third_party_services()]
    contact = privacy_service.get_privacy_contact_info()
    return PoliciesResponse(
        policies=policies,
        third_party_services=services,
        privacy_contact=contact,
    )


@router.get("/consent", response_model=ConsentStatusResponse)
def get_consent_status(
    actor: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
) -> ConsentStatusResponse:
    """Retrieve active consent records for the currently authenticated user or parent."""
    records = privacy_service.get_user_consents(db, actor)
    active_types = [r.consent_type for r in records if r.status == "granted"]

    # Check required consents
    required = ["terms", "privacy_policy", "health_data_processing"]
    missing = [req for req in required if req not in active_types]

    return ConsentStatusResponse(
        consents=[ConsentItemOut.model_validate(r) for r in records],
        active_types=active_types,
        missing_required=missing,
    )


@router.post("/consent", response_model=ConsentItemOut)
def record_grant_consent(
    payload: GrantConsentRequest,
    request: Request,
    actor: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
) -> ConsentItemOut:
    """Acknowledge or grant consent for a specific policy or processing scope."""
    consent = privacy_service.grant_consent(
        db,
        actor=actor,
        consent_type=payload.consent_type,
        policy_version=payload.policy_version,
        request=request,
        metadata_json=payload.metadata_json,
    )
    return ConsentItemOut.model_validate(consent)


@router.post("/consent/withdraw", response_model=ConsentItemOut)
def record_withdraw_consent(
    payload: WithdrawConsentRequest,
    actor: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
) -> ConsentItemOut:
    """Withdraw an optional consent (e.g. AI processing, marketing communications)."""
    consent = privacy_service.withdraw_consent(
        db,
        actor=actor,
        consent_type=payload.consent_type,
        reason=payload.reason,
    )
    return ConsentItemOut.model_validate(consent)


@router.get("/export", response_model=DataExportResponse)
def export_my_data(
    actor: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
) -> DataExportResponse:
    """Export all personal data associated with the authenticated account in structured JSON."""
    data = privacy_service.export_user_data(db, actor)
    return DataExportResponse(**data)


@router.post("/delete-data")
def delete_selected_data(
    payload: DeleteDataRequest,
    actor: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Selectively delete health logs, check-ins, or notifications with mandatory password re-auth."""
    return privacy_service.delete_user_data(
        db,
        actor=actor,
        password=payload.password,
        delete_scope=payload.delete_scope,
    )


@router.post("/delete-account")
def delete_account(
    payload: DeleteAccountRequest,
    actor: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Permanently delete user/parent account, cascades, and family ownership handling."""
    return privacy_service.delete_user_account(
        db,
        actor=actor,
        password=payload.password,
        confirmation=payload.confirmation,
    )


@router.get("/parent-authorizations", response_model=list[ParentAuthorizationOut])
def get_parent_authorizations(
    parent: Parent = Depends(get_authenticated_parent),
    db: Session = Depends(get_db),
) -> list[ParentAuthorizationOut]:
    """Parent endpoint: view data-sharing authorizations granted to family."""
    auths = privacy_service.get_parent_authorizations(db, parent)
    return [ParentAuthorizationOut.model_validate(a) for a in auths]


@router.post("/parent-authorizations", response_model=ParentAuthorizationOut)
def update_parent_authorization(
    payload: UpdateParentAuthorizationRequest,
    parent: Parent = Depends(get_authenticated_parent),
    db: Session = Depends(get_db),
) -> ParentAuthorizationOut:
    """Parent endpoint: update data sharing scopes or revoke authorization for their family."""
    auth = privacy_service.update_parent_authorization(
        db,
        parent=parent,
        family_id=parent.family_id,
        scopes=payload.authorized_scopes,
        status_str=payload.status,
    )
    return ParentAuthorizationOut.model_validate(auth)
