import { apiRequest } from "./client";

export interface PolicyVersion {
  policy_type: string;
  version: string;
  effective_date: string;
  title: string;
  summary: string;
  url: string;
  is_required: boolean;
}

export interface ThirdPartyService {
  name: string;
  provider: string;
  category: string;
  purpose: string;
  data_involved: string;
  storage_retention: string;
  is_active: boolean;
}

export interface PoliciesResponse {
  policies: PolicyVersion[];
  third_party_services: ThirdPartyService[];
  privacy_contact: {
    contact_email: string;
    contact_role: string;
    turnaround_time: string;
    note: string;
  };
}

export interface ConsentItem {
  id: string;
  consent_type: string;
  policy_version: string;
  status: "granted" | "revoked";
  granted_at: string;
  revoked_at?: string | null;
  metadata_json?: Record<string, any> | null;
}

export interface ConsentStatusResponse {
  consents: ConsentItem[];
  active_types: string[];
  missing_required: string[];
}

export interface DataExportResponse {
  export_id: string;
  generated_at: string;
  export_version: string;
  actor_type: "user" | "parent";
  user_profile?: any;
  parent_profile?: any;
  family_memberships: any[];
  health_logs: any[];
  medicines: any[];
  reports: any[];
  notifications: any[];
  consent_history: any[];
  parent_authorizations: any[];
}

export interface ParentAuthorizationItem {
  id: string;
  parent_id: string;
  family_id: string;
  authorized_scopes: string[];
  status: "active" | "revoked";
  granted_at: string;
  revoked_at?: string | null;
  notes?: string | null;
}

export async function fetchPolicies(): Promise<PoliciesResponse> {
  return apiRequest<PoliciesResponse>("/privacy/policies");
}

export async function fetchConsentStatus(): Promise<ConsentStatusResponse> {
  return apiRequest<ConsentStatusResponse>("/privacy/consent");
}

export async function grantConsent(
  consentType: string,
  policyVersion: string = "v1.0",
  metadata?: Record<string, any>
): Promise<ConsentItem> {
  return apiRequest<ConsentItem>("/privacy/consent", {
    method: "POST",
    body: {
      consent_type: consentType,
      policy_version: policyVersion,
      metadata_json: metadata,
    },
  });
}

export async function withdrawConsent(
  consentType: string,
  reason?: string
): Promise<ConsentItem> {
  return apiRequest<ConsentItem>("/privacy/consent/withdraw", {
    method: "POST",
    body: {
      consent_type: consentType,
      reason,
    },
  });
}

export async function exportUserData(): Promise<DataExportResponse> {
  return apiRequest<DataExportResponse>("/privacy/export");
}

export async function deleteUserData(
  password: string,
  deleteScope: "health_and_activity" | "notifications" | "all_records"
): Promise<{ success: boolean; scope: string; deleted_records: Record<string, number> }> {
  return apiRequest("/privacy/delete-data", {
    method: "POST",
    body: {
      password,
      delete_scope: deleteScope,
    },
  });
}

export async function deleteUserAccount(
  password: string,
  confirmation: string = "DELETE"
): Promise<{ success: boolean; message: string }> {
  return apiRequest("/privacy/delete-account", {
    method: "POST",
    body: {
      password,
      confirmation,
    },
  });
}

export async function fetchParentAuthorizations(): Promise<ParentAuthorizationItem[]> {
  return apiRequest<ParentAuthorizationItem[]>("/privacy/parent-authorizations");
}

export async function updateParentAuthorization(
  scopes: string[],
  status: "active" | "revoked" = "active"
): Promise<ParentAuthorizationItem> {
  return apiRequest<ParentAuthorizationItem>("/privacy/parent-authorizations", {
    method: "POST",
    body: {
      authorized_scopes: scopes,
      status,
    },
  });
}
