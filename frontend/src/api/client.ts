/**
 * API client abstraction.
 *
 * All service modules call `apiRequest`. When `VITE_USE_MOCK` is unset/true the
 * mock handlers resolve realistic data with simulated latency; when set to
 * "false" requests are sent to the real FastAPI backend at `VITE_API_URL`.
 */
const BASE_URL: string = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/+$/, "");
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK !== "false";
export const MOCK_LATENCY_MS = 350;

const TOKEN_KEY = "parently.accessToken";
const REFRESH_KEY = "parently.refreshToken";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string | null, refresh: string | null): void {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  else localStorage.removeItem(TOKEN_KEY);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (USE_MOCK) {
    throw new ApiError(501, `[mock] ${path} is not registered with a mock handler`);
  }
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    if (res.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) return apiRequest<T>(path, options);
    }
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      const detail = data.detail;
      if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg ?? String(d)).join("; ");
      } else if (typeof detail === "string" && detail) {
        message = detail;
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) {
    window.dispatchEvent(new CustomEvent("parently:auth-expired"));
    return false;
  }
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) {
      setTokens(null, null);
      window.dispatchEvent(new CustomEvent("parently:auth-expired"));
      return false;
    }
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

/** Simulates network latency for mock handlers. */
export async function mockDelay(ms: number = MOCK_LATENCY_MS): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 150));
}
