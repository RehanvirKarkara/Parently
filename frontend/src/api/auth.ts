import { apiRequest, mockDelay, setTokens, USE_MOCK } from "@/api/client";
import { mockDb } from "@/api/mockDb";
import type { User } from "@/types";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  mode: "offspring" | "parent";
  parent_id?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function fakeToken(claim: string): string {
  const payload = btoa(JSON.stringify({ sub: claim, exp: Date.now() + 1000 * 60 * 60 }));
  return `mock.${payload}.${Math.random().toString(36).slice(2)}`;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(700);
    const exists = mockDb.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (exists) {
      throw new Error("An account with this email already exists.");
    }
    const user: User = {
      id: newId("u"),
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.users.push(user);
    const tokens = { access_token: fakeToken(user.id), refresh_token: fakeToken(user.id), token_type: "bearer" };
    setTokens(tokens.access_token, tokens.refresh_token);
    return { user, tokens, mode: "offspring" };
  }
  return apiRequest<AuthResponse>("/auth/register", { method: "POST", body: payload });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(650);
    const email = payload.email.toLowerCase().trim();

    if (email === "carol@parently.app" || email === "robert@parently.app") {
      const parent = mockDb.parents.find((p) => p.email.toLowerCase() === email);
      if (!parent) throw new Error("Invalid credentials.");
      const user: User = {
        id: parent.id,
        email: parent.email,
        first_name: parent.first_name,
        last_name: parent.last_name,
        is_active: true,
        is_verified: true,
        created_at: parent.created_at,
        updated_at: parent.updated_at,
        avatar_color: parent.avatar_color ?? "brand",
      };
      const tokens = { access_token: fakeToken(parent.id), refresh_token: fakeToken(parent.id), token_type: "bearer" };
      setTokens(tokens.access_token, tokens.refresh_token);
      return { user, tokens, mode: "parent", parent_id: parent.id };
    }

    const user = mockDb.users.find((u) => u.email.toLowerCase() === email);
    if (!user) throw new Error("No account found with this email.");
    if (!payload.password || payload.password.length < 6) {
      throw new Error("Invalid password.");
    }
    const tokens = { access_token: fakeToken(user.id), refresh_token: fakeToken(user.id), token_type: "bearer" };
    setTokens(tokens.access_token, tokens.refresh_token);
    return { user, tokens, mode: "offspring" };
  }
  return apiRequest<AuthResponse>("/auth/login", { method: "POST", body: payload });
}

export interface OtpPayload {
  email: string;
  purpose: "parent_invite" | "email_verification" | "password_reset";
}

export interface OtpResponse {
  success: boolean;
  /** Mock-only: the OTP would be emailed by Resend in production. */
  dev_code?: string;
}

export async function requestOtp(payload: OtpPayload): Promise<OtpResponse> {
  if (USE_MOCK) {
    await mockDelay(600);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    mockDb.otpStore.set(payload.email.toLowerCase(), {
      code,
      purpose: payload.purpose,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    return { success: true, dev_code: code };
  }
  return apiRequest<OtpResponse>("/auth/otp/request", { method: "POST", body: payload });
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
  purpose: OtpPayload["purpose"];
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await mockDelay(500);
    const record = mockDb.otpStore.get(payload.email.toLowerCase());
    if (!record) throw new Error("No OTP was requested for this email. Please request a new code.");
    if (new Date(record.expires_at) < new Date()) throw new Error("This code has expired. Please request a new one.");
    if (record.code !== payload.code) throw new Error("That code doesn't match. Please check and try again.");
    if (payload.purpose !== "password_reset") {
      mockDb.otpStore.delete(payload.email.toLowerCase());
    }
    return { success: true };
  }
  return apiRequest("/auth/otp/verify", { method: "POST", body: payload });
}

export async function requestPasswordReset(email: string): Promise<OtpResponse> {
  if (USE_MOCK) {
    await mockDelay(600);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    mockDb.otpStore.set(email.toLowerCase(), {
      code,
      purpose: "password_reset",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    return { success: true, dev_code: code };
  }
  return apiRequest<OtpResponse>("/auth/password-reset/request", { method: "POST", body: { email } });
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  new_password: string;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await mockDelay(600);
    const record = mockDb.otpStore.get(payload.email.toLowerCase());
    if (!record || record.code !== payload.code || record.purpose !== "password_reset") {
      throw new Error("Invalid or expired verification code.");
    }
    mockDb.otpStore.delete(payload.email.toLowerCase());
    return { success: true };
  }
  return apiRequest("/auth/password-reset", { method: "POST", body: payload });
}

export function logout(): void {
  setTokens(null, null);
}

export interface ParentRegisterPayload {
  email: string;
  password: string;
}

/** Registers a password on the pending Parent profile invited by this family. */
export async function registerParent(payload: ParentRegisterPayload): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(600);
    const email = payload.email.toLowerCase().trim();
    if (email === "carol@parently.app" || email === "robert@parently.app") {
      throw new Error("This invitation has already been completed. Please sign in.");
    }
    const parent = mockDb.parents.find((p) => p.email.toLowerCase() === email);
    if (!parent) {
      throw new Error("This email was not invited. Please login using the email address that received the invitation.");
    }
    const user: User = {
      id: parent.id,
      email: parent.email,
      first_name: parent.first_name,
      last_name: parent.last_name,
      is_active: false,
      is_verified: true,
      created_at: parent.created_at,
      updated_at: parent.updated_at,
      avatar_color: parent.avatar_color ?? "brand",
    };
    const tokens = { access_token: fakeToken(parent.id), refresh_token: fakeToken(parent.id), token_type: "bearer" };
    setTokens(tokens.access_token, tokens.refresh_token);
    return { user, tokens, mode: "parent", parent_id: parent.id };
  }
  return apiRequest<AuthResponse>("/auth/parent/register", { method: "POST", body: payload });
}

export interface ParentActivateResult {
  success: boolean;
  already_active?: boolean;
}

/** Verified-logged-in parent completes their invitation OTP and joins the family. */
export async function activateParentInvite(code: string): Promise<ParentActivateResult> {
  if (USE_MOCK) {
    await mockDelay(500);
    const record = [...mockDb.otpStore.entries()].find(([, r]) => r.code === code && r.purpose === "parent_invite");
    if (!record) throw new Error("That code doesn't match. Please check and try again.");
    const [email] = record;
    const parent = mockDb.parents.find((p) => p.email.toLowerCase() === email);
    if (!parent) {
      throw new Error("This email was not invited. Please login using the email address that received the invitation.");
    }
    parent.is_active = true;
    mockDb.otpStore.delete(email);
    return { success: true };
  }
  return apiRequest<ParentActivateResult>("/auth/parent/activate", { method: "POST", body: { code } });
}

export async function getMe(): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockDb.users[0];
  }
  return apiRequest<User>("/auth/me");
}
