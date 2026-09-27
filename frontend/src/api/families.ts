import { apiRequest, mockDelay, USE_MOCK } from "@/api/client";
import { mockDb } from "@/api/mockDb";
import type { Family, FamilyMember, Parent, SiblingInvite, User } from "@/types";

export interface ParentInvitePayload {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  medical_conditions: string;
  allergies: string;
  blood_group?: string;
  goals?: string[];
}

export interface ParentInviteResult {
  parent: Parent;
  otp_sent: boolean;
  dev_code?: string;
}

export async function getMyFamily(): Promise<Family> {
  if (USE_MOCK) {
    await mockDelay(180);
    return mockDb.family;
  }
  return apiRequest<Family>("/families/me");
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  if (USE_MOCK) {
    await mockDelay(220);
    return mockDb.familyMembers.filter((m) => m.is_active);
  }
  return apiRequest<FamilyMember[]>("/families/me/members");
}

export async function getFamilyUsers(): Promise<User[]> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockDb.users;
  }
  return apiRequest<User[]>("/families/me/users");
}

export async function getParents(): Promise<Parent[]> {
  if (USE_MOCK) {
    await mockDelay(260);
    return mockDb.parents.filter((p) => p.is_active);
  }
  return apiRequest<Parent[]>("/families/parents");
}

export async function getParent(id: string): Promise<Parent> {
  if (USE_MOCK) {
    await mockDelay(180);
    const parent = mockDb.parents.find((p) => p.id === id);
    if (!parent) throw new Error("Parent not found.");
    return parent;
  }
  return apiRequest<Parent>(`/families/parents/${id}`);
}

/** Creates the parent profile and returns the OTP that would be emailed (Resend). */
export async function inviteParent(payload: ParentInvitePayload): Promise<ParentInviteResult> {
  if (USE_MOCK) {
    await mockDelay(900);
    const email = payload.email.trim().toLowerCase();
    const exists = mockDb.parents.some((p) => p.email.toLowerCase() === email);
    if (exists) throw new Error("A parent with this email is already in your family.");
    const parent: Parent = {
      id: `p-${Date.now().toString(36)}`,
      family_id: mockDb.family.id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email,
      medical_conditions: payload.medical_conditions,
      allergies: payload.allergies,
      date_of_birth: payload.date_of_birth,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      blood_group: payload.blood_group,
      goals: payload.goals ?? [],
      avatar_color: "brand",
    };
    mockDb.parents.push(parent);
    const devCode = String(Math.floor(100000 + Math.random() * 900000));
    mockDb.otpStore.set(email, { code: devCode, purpose: "parent_invite", expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
    return { parent, otp_sent: true, dev_code: devCode };
  }
  return apiRequest<ParentInviteResult>("/families/me/parents/invite", { method: "POST", body: payload });
}

export interface AcceptInvitePayload {
  email: string;
  code: string;
}

/** Parent accepts invitation via OTP — family is created/linked and parent activated. */
export async function acceptParentInvite(payload: AcceptInvitePayload): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await mockDelay(700);
    const record = mockDb.otpStore.get(payload.email.toLowerCase());
    if (!record || record.code !== payload.code || record.purpose !== "parent_invite") {
      throw new Error("The code is incorrect or has expired. Please request a new one.");
    }
    const parent = mockDb.parents.find((p) => p.email.toLowerCase() === payload.email.toLowerCase());
    if (parent) {
      parent.is_active = true;
      parent.updated_at = new Date().toISOString();
    }
    mockDb.otpStore.delete(payload.email.toLowerCase());
    return { success: true };
  }
  return apiRequest("/families/me/parents/invite/accept", { method: "POST", body: payload });
}

export async function inviteSibling(email: string): Promise<{ success: boolean; dev_code?: string }> {
  if (USE_MOCK) {
    await mockDelay(700);
    mockDb.siblingInvites.unshift({ email, status: "pending", invited_at: new Date().toISOString() });
    const devCode = String(Math.floor(100000 + Math.random() * 900000));
    mockDb.otpStore.set(email.toLowerCase(), { code: devCode, purpose: "email_verification", expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });
    return { success: true, dev_code: devCode };
  }
  return apiRequest("/families/me/siblings/invite", { method: "POST", body: { email } });
}

export async function resendParentInvite(parentId: string): Promise<{ success: boolean; dev_code?: string }> {
  if (USE_MOCK) {
    await mockDelay(500);
    const parent = mockDb.parents.find((p) => p.id === parentId);
    if (!parent) throw new Error("Parent not found.");
    const devCode = String(Math.floor(100000 + Math.random() * 900000));
    mockDb.otpStore.set(parent.email.toLowerCase(), { code: devCode, purpose: "parent_invite", expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
    return { success: true, dev_code: devCode };
  }
  return apiRequest(`/families/parents/${parentId}/invite/resend`, { method: "POST" });
}

export async function getSiblingInvites(): Promise<SiblingInvite[]> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockDb.siblingInvites;
  }
  return apiRequest<SiblingInvite[]>("/families/me/siblings/invites");
}
