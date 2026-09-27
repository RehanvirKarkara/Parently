# Parently — Pre-Production QA Report

**Date:** 2026-08-18
**Scope:** Backend (FastAPI, `backend/`) + Frontend (React/Vite, `frontend/`) — full pre-production audit
**Environment:** Backend uvicorn `:8000` (PID 17771), frontend vite `:5173`, SQLite `backend/database/parently.db`, API base `http://localhost:8000/api/v1`. `.env`: `ENVIRONMENT=development`, `DEBUG=true`, `JWT_SECRET=dev-secret-change-me`, `GROQ_API_KEY` empty (AI falls back to canned reply), Brevo SMTP configured (OTP codes only readable via DB).
**Method:** Black-box HTTP test harnesses (`qa_p1.py`, `qa_p2.py`, `qa_auth.py`, `qa_p3.py`) against the live server + source review + frontend static audit. **No bugs were fixed** (per instructions) except harness artifacts.

---

## 1. Test Totals

| Suite | Tests | Pass | Fail | Notes |
|---|---|---|---|---|
| P1 — Parent onboarding / family linking | 32 | 30 | 2 | 2 harness artifacts, no app bug |
| P2 — Health logs / medicines / reports / AI / notifications | 37 | 36 | 1 | 1 minor finding (R5) |
| AUTH — Auth / OTP / password reset / refresh / token security | 18 | 18 | 0 | — |
| P3 — Quiz / legacy / families listing / notifications authz / DB integrity | 32 | 26 | 6 | 4 unique real bugs |
| **Total** | **119** | **110** | **9** | **5 unique app findings** |

---

## 2. Findings by Severity

### CRITICAL — C1: Weak default JWT secret enables token forgery
- **Evidence:** A forged JWT signed with the shipped default `JWT_SECRET=dev-secret-change-me` (20 chars, listed in `_WEAK_SECRETS`) was **accepted** by the parent-only activation route — auth completely bypassed (request proceeded to the OTP check; returns 200 on the endpoint it targets when forged as a valid principal).
- **Root cause:** `backend/app/core/config.py` (~lines 120–128) only validates secret strength when `ENVIRONMENT != development`. The default `.env` ships `ENVIRONMENT=development` + the known weak secret, so any deployment that forgets to change the secret is fully forgeable. If someone flips `ENVIRONMENT=production` without changing the secret, the app instead **crashes on boot** (fail-safe, but confusing).
- **Files:** `backend/app/core/config.py`, `backend/.env`
- **Fix:** Change the dev secret; add a hard guard that rejects the default/weak secret regardless of environment (or auto-generate a random one per deployment and refuse to start with the default). Rotate any tokens issued under the default secret.

### HIGH — H1: Notifications feature is dead code — nothing is ever created
- **Evidence:** `GET /notifications` returns `[]` for fresh users (N1). Source review confirms `notify_all_children()` / `push_parent()` in `backend/app/services/notification.py` are **never called anywhere** in the API layer. Only `seed.py` inserts `Notification` rows. No reminders, alerts, check-in nudges, or report notifications exist.
- **Files:** `backend/app/services/notification.py`, `backend/app/api/v1/notifications.py`
- **Fix:** Hook the service into business events (health-log submission, report generation, low day_rating, missed check-ins) or remove the feature.

### HIGH — H2: `GET /quiz/answers` leaks other families' answers
- **Evidence:** Family A submits an answer (`"sunny"`); Family B's `GET /quiz/answers` returns it (`A={'sunny','Roses'} B={'sunny','Roses'}`). Repeated 3× consistently.
- **Root cause:** `backend/app/api/v1/engagement.py:30-37` — `get_quiz_answers()` has no family scope; returns every `QuizAnswer` app-wide.
- **Fix:** Restrict to the principal's family (join `QuizAnswer → FamilyMember → family_id` like the POST handler already does at engagement.py:52-62).

### HIGH — H3: `GET /families/me/siblings/invites` leaks all invite emails app-wide
- **Evidence:** Family B's listing returned Family A's sibling-invite email. Source: `backend/app/api/v1/families.py:207-217` returns **all** `email_verification` OTP rows globally; no principal/family filter.
- **Fix:** Filter by the principal's family (OTP table has no family FK — resolve via member's family or add a family_id/email-ownership check).

### HIGH — H4: `POST /notifications/{id}/read` has no authentication and no ownership check
- **Evidence:** Endpoint returns `200` with **no token at all**; an authenticated user from family B successfully marked family A's notification read (`is_read` flipped to 1 in DB).
- **Root cause:** `backend/app/api/v1/notifications.py:35-42` — the `mark_read` handler has no `Depends(get_current_user_or_parent)` and no check that `recipient_user_id`/`recipient_parent_id` matches the principal.
- **Fix:** Add the auth dependency + ownership check (same as `read-all`).

### HIGH — H5: `POST /families/parents/{parent_id}/invite/resend` has no authentication
- **Evidence:** Endpoint returns `200` with no token at all (forged/absent Authorization header). Anyone who learns a parent UUID can resend invite emails (OTP spamming / mail-bomb vector).
- **Root cause:** `backend/app/api/v1/families.py:196-204` — no `Depends(...)` on the handler, only the bodyless `parent_id` path.
- **Fix:** Require an authenticated principal of the parent's family (add `_resolve_membership` + family match like `get_parent` at families.py:111-123).

### MEDIUM — M1: Invalid `report_type` returns 422 (pydantic) instead of the service's 400
- **Evidence:** `POST /reports/generate {"report_type":"yearly"}` → `422 {"detail":"report_type: String should match pattern 'weekly|monthly'"}`. The 400 branch in the report service is unreachable via API validation.
- **Files:** `backend/app/api/v1/reports.py`, `backend/app/services/report_service.py`
- **Fix (optional):** Accept a free string and validate in the service for a single consistent 400, or drop the dead 400 branch.

### LOW/INFO — I1: Refresh tokens are never revoked (logout is client-only)
- **Evidence:** After `POST /auth/logout` (client clears local storage), the previously issued refresh token still returns fresh tokens. Stateless JWT design — no deny-list.
- **Fix (optional):** Token version/revocation store for sensitive deployments.

### LOW/INFO — I2: Minor validation inconsistencies
- `code: null` body → 422 pydantic instead of the 400 string-type used for a mismatched code (S12 artifact; the app is correct — OTP row was consumed → no code exists).
- Password reset with short `new_password` → 422 before OTP validation (ordering only; acceptable).
- Emails matching reserved TLDs (e.g. `.test`) rejected by `EmailStr`; all emails lowercased at register/invite/OTP — consistent.

### LOW/INFO — I3: No user-only endpoints; roles enforced ad hoc
- `get_current_user_id` / `get_current_user` deps are never used; every route uses `get_current_user_or_parent` and role-checks manually (AI 403s, health-log `parent_id` scope). Works today (all cross-role tests pass) but is fragile to future endpoints forgetting the check (cf. H4/H5).

---

## 3. Verified Working (passed)

**Parent onboarding** (30/32; 2 harness artifacts): family auto-created with 1 member on register; invite → OTP → register → activate; uppercase email register; wrong OTP 400; correct OTP activates + **OTP single-use (row deleted)**; double activation idempotent (`already_active`); parent linked to existing family (no extra family); pending parent can login (needed for activation page) but blocked from data (401); active parent re-invited by another family → 409; uninvited email → exact 404 message; expired OTP rejected; resend issues fresh code that works; duplicate invite → 409, no duplicate row.

**Health logs:** POST/upsert by (date, period) — no duplicate rows, updates persist; family scoping + `parent_id` filter; parent tokens can submit+read own family's logs; cross-family write → 404; validation (bad `time_of_day`, `day_rating>10`, missing `parent_id`) rejected.

**Medicines:** CRUD; **soft delete** (`is_active=False`, hidden from lists); cross-family delete/list → 404.

**Reports:** weekly & monthly generated from real HealthLog+Medicine data (content includes `Parent: Pat Two`, avg sleep, day rating); single report fetch; (only M1 above).

**AI chat:** offspring + parent replies (fallback engine since no GROQ key); role mismatch → 403; cross-family parent chat → 403; conversation history persisted.

**Legacy answers:** POST scoped to own family (cross-family → 404); list scoped correctly (family B saw only its own).

**Auth:** refresh rotation (valid → new pair; tampered/garbage → 401); expired/forged access tok → 401; missing token → 401; malformed scheme → 401; forgot-password endpoint doesn't enumerate emails (unknown email → 200); user + parent password reset flows work end-to-end; old password invalid after reset; wrong code → 400.

**Families:** `/families/me`, `/me/members`, `/me/users`, `/families/parents` (user + parent tokens), cross-family parent fetch → 404.

**DB integrity:** 0 orphan health_logs/medicines/legacy_answers/quiz_answers; no family_members dangling on users/families; no parents without family; all 66 families have ≥1 member.

**Frontend:** `npm run build` + `npm run lint` pass; every `src/api/*.ts` path matches the backend contract (auth, families, health, medicines, reports, ai, engagement incl. `/parents/{id}/health-logs/{date}/{period}`, `/quiz/*`, `/legacy/*`, `/notifications/*`); `client.ts` stores tokens in localStorage with automatic 401→refresh retry; `.env` correctly has `VITE_API_URL=http://localhost:8000/api/v1` and `VITE_USE_MOCK=false`.

**Ops:** rate limiting active (per-IP+key, 60/min) — not exhausted under normal load; Brevo SMTP delivery path wired (no `dev_code` in responses).

---

## 4. Harness Artifacts (not app bugs)

- P1 S12: harness sent `code: null` (OTP row legitimately consumed) → 422 pydantic (app correct).
- P1 parent-count invariant: harness off-by-N in expected invite count (app rows are consistent).
- P2 R5 is a real (minor) finding — see M1.

---

## 5. Recommendations (priority order)

1. **Fix C1 immediately** — every deployment with the default secret is forgeable; rotate all issued tokens.
2. **Fix H2–H5** — one-line authz guards each; all reproduced.
3. Decide H1 (wiring or removal) before feature commitment.
4. Address I1–I3 as hardening pass.
5. Re-run the 4 harnesses after fixes to confirm green (P1/P2/AUTH should be 100% green already; P3 needs H2–H5 fixed).