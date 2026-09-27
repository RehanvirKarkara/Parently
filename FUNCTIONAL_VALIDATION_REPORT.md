# Parently — Functional Validation Report

**Date:** 2026-08-18
**Scope:** End-to-end functional validation of user-facing features (backend + frontend data contract).
**Method:** A live HTTP harness (`qa_func.py`) created **real** child and parent accounts, completed the parent invitation activation, then exercised the full usage arc (check-ins across all 4 periods/fields, dashboards, graphs, reports, AI chat, family sync, notifications, medication reminders) against the running backend (`http://localhost:8000/api/v1`), reading persisted state back from the DB (`backend/database/parently.db`). This report covers **functional behavior** only; the companion `QA_REPORT.md` covers the security audit (which is assumed already addressed).
**Environment:** same as the QA report — backend `:8000` (PID 17771), SQLite DB, Brevo SMTP wired (OTP codes only visible via DB; `GROQ_API_KEY` unset so the AI assistant runs its built-in fallback generator).

> Note: "child dashboard" and "parent dashboard" are rendered client-side (React/Vite) from the JSON returned by the API. Because the browser was not directly driven here, each dashboard feature was validated by asserting that **every data source the dashboard reads** (family profile, member/parent/user lists, the parent's health logs, notification feed, etc.) returns the correct, correctly-scoped data for each role. That is the functional guarantee the dashboard depends on.

---

## 1. Results Summary

| # | Feature | Result |
|---|---|---|
| 1 | Parent invitation flow | **PASS** |
| 2 | Parent joining an existing family | **PASS** |
| 3 | Parent login after invitation | **PASS** |
| 4 | Child dashboard updates | **PASS** |
| 5 | Parent dashboard updates | **PASS** |
| 6 | Daily sleep check-in | **PASS** |
| 7 | Daily diet check-in | **PASS** |
| 8 | Daily workout / activity check-in | **PASS** |
| 9 | Daily mood check-in | **PASS** |
| 10 | Medication adherence flag (per check-in) | **PASS** |
| 11 | Graph updates after new entries | **PASS** |
| 12 | Notifications to parent | **FAIL** |
| 13 | Notifications to child | **FAIL** |
| 14 | Reports generation | **PASS** |
| 15 | AI Assistant using the latest health data | **PASS** |
| 16 | Family synchronization across accounts | **PASS** |
| 17 | Medication reminders | **FAIL** |

**Totals: 14 PASS, 3 FAIL (2 distinct root causes).**

---

## 2. Detailed Findings (FAIL items)

### FAIL — 12: Notifications to parent
- **What was done:** invited and activated a parent, the child submitted morning/afternoon/evening check-ins, medicines were created, a weekly report was generated, then `GET /notifications` was queried as both parent and child.
- **Expected:** parent (and child) receive a notification (e.g., "parent checked in", "child submitted a check-in", "medicine due", "weekly report ready") after the corresponding events.
- **Actual:** both feeds return `[]`; **zero** notification rows exist for either recipient during the entire usage arc (only seed/demo rows and a test-injected row exist in the DB).
- **Root cause:** the notification service is dead code. `notify_all_children()` and `push_parent()` are defined in `backend/app/services/notification.py` but are **never called** from any API handler or startup event. No event hooks exist for check-ins, report generation, medicine times, or parent/child activity. See also findings C1/H1 in `QA_REPORT.md`.
- **Files involved:** `backend/app/services/notification.py`, `backend/app/api/v1/notifications.py`, `backend/app/api/v1/health.py`, `backend/app/api/v1/reports.py`, `backend/app/api/v1/medicines.py`.
- **Repro log:** `qa_func.py` F12/F13 — `GET /notifications` (parent token) → `200, []`; `GET /notifications` (child token) → `200, []`; DB `notifications` row count for both recipients = `0`.
- **Recommended fix:** create a small event publisher (e.g. `notify(parent_id=…, type="check_in")`, `notify(recipient_user_id=…, type="report_ready")`) and call it from the check-in submission, report generation, and medicine-creation handlers. Then either deliver via server-sent events / WebSocket + in-app feed (the `GET /notifications` list endpoint already supports this), or via email via the already-configured Brevo SMTP path. Wire a background task/celery job for timed reminders (see #17).

### FAIL — 13: Notifications to child
- **What was done:** the child completed onboarding and read check-ins; queried `GET /notifications` as the child user throughout.
- **Expected:** child receives notifications when the parent submits check-ins or when there's an alert-worthy signal (e.g., missed check-in, low day rating) — the offspring AI prompt is explicitly built to "notify you immediately if the trend changes."
- **Actual:** `GET /notifications` returns `[]` for the child; 0 recipient rows.
- **Root cause:** identical to #12 — no notification is generated for any event, child or parent. The offspring-role AI is the intended notification surface, but it is pull-only (child must open `/ai`) and is not backed by a push/alert record.
- **Files involved:** `backend/app/services/notification.py`, `backend/app/services/ai_service.py` (ai_service.py is consulted for insights but never dispatches a Notification), `backend/app/api/v1/notifications.py`.
- **Repro log:** same as #12; child notifications count `0`.
- **Recommended fix:** same publisher as #12. Specifically add alerts for "parent missed a check-in", "day_rating below threshold", and "report ready", scoped to the child (`recipient_user_id`). Consider an unread-count feed so the child sees a badge.

### FAIL — 17: Medication reminders
- **What was done:** created a medicine (`"Vitamin D"`, frequency `daily`, `time: "08:00"`) for the parent; then checked (a) whether the `medicines` schema has any reminder/schedule/notification column, and (b) whether any notification or scheduled job was produced, and (c) whether any scheduler/worker is wired into the app.
- **Expected:** a medication with a frequency and time should produce recurring reminders (push notification / email / in-app) to the parent, ideally reflected in the medicines UI as "today's dose" and tracked for adherence.
- **Actual:** 
  - Schema has **no** reminder fields (`medicines` columns = parent_id, name, dosage, frequency, instructions, start_date, end_date, time, color, is_active, created_at, updated_at) — `time`/`frequency`/`start_date` are stored but never actioned.
  - **No scheduler/worker exists**: no `apscheduler`, `celery` task, `@app.on_event("startup")`, `BackgroundTasks`, or cron in `main.py` or any router; the only `celery_*` references are unused `Settings` properties (`backend/app/core/config.py:136-141`). `notify_all_children`/`push_parent` are never invoked.
  - No notification was generated for the parent (`notifications` count = 0).
- **Root cause:** medication reminders were never implemented. There is record storage (name/dosage/frequency/time) and soft-delete, but no reminder engine and no background job infrastructure to fire time-based notifications.
- **Files involved:** `backend/app/models.py` (Medicine), `backend/app/api/v1/medicines.py`, `backend/app/services/notification.py`, `backend/app/main.py`, `backend/app/core/config.py:136-141` (unused celery settings).
- **Repro log:** `qa_func.py` F17 — medicine created `200`; schema scan: no `reminder_*`/`schedule`/`notify` columns present; file scan: no real scheduler references; parent notification count = `0`.
- **Recommended fix (two parts):**
  1. Add a lightweight background job (FastAPI `BackgroundTasks` for one-off reminders, or Celery if `celery_broker`/`celery_backend` are configured for production) that, per active medicine with a `time`/`frequency`, schedules a `notify(parent_id, type="med_reminder")` at the configured time each day.
  2. Expose a simple adherence API and surface today's pending/past doses on the parent medicines page.

---

## 3. Verified Working (PASS items)

### 1. Parent invitation flow
Child (offspring) authenticates, then `POST /families/me/parents/invite` with parent email + details. Endpoint returns the created (inactive) `parent` object with `family_id` already set to the child's family, `is_active=false`, and `otp_sent=true`. OTP code is issued (`otp_codes` row, purpose `parent_invite`) and retrievable. `backend/app/api/v1/families.py:126-164`, `backend/app/services/otp.py`.
- **Test log:** `F1 parent invitation returns pending parent + otp_sent | {'is_active': False, 'otp_sent': True, 'family_id': '<child's family>'}`

### 2. Parent joining an existing family
Invited parent's `family_id` equals the child's family id (no new Family row created on activation). DB row inspected.
- **Test log:** `F2 parent linked to child's existing family (no new family) | family_id matches fam_id`

### 3. Parent login after invitation
Parent activates via OTP (`/auth/parent/activate`), then `POST /auth/login` succeeds and returns `mode="parent"` + `parent_id`.
- **Test log:** `F3 parent can login with own password | mode=parent, parent_id present`

### 4. Child dashboard updates
For the child, every dashboard data source resolves correctly: `/families/me` returns the child's family; `/families/parents` lists the **active** invited parent (with correct `family_id`); `/parents/<id>/health-logs` returns the parent's logs. Verified after parent was activated.
- **Test logs:** `F4 child's family resolves (dashboard root)`, `F4 child dashboard lists family parents`, `F4 child dashboard can read parent's health logs`

### 5. Parent dashboard updates
Parent `GET /families/me` returns the same family id as the child (synchronization); `/families/parents` lists the parent; parent can read the family's health logs.
- **Test logs:** `F5 parent family resolves (same family as child)`, `F5 parent sees the same family as child (sync)`, `F5 parent dashboard lists parents in family`

### 6. Daily sleep check-in
`POST /health-logs` with `log_time_of_day=morning`, `hours_slept=7.5`, `meds_taken=true` returns `200` and persists; the value is read back via `/parents/<id>/health-logs`.
- **Test log:** `F6/F7/F8/F9/F10 submit morning check-in | 200`; `F6-F10 … all check-in sub-fields persisted … hours_slept=7.5`

### 7. Daily diet check-in
`afternoon` entry persisted with `breakfast_details="oatmeal + berries"`, `lunch_details="salad + chicken"`, `steps_walked_afternoon=1500`. All read back correctly.
- **Test log:** sub-fields `breakfast`/`lunch` persisted & queryable.

### 8. Daily workout / activity check-in
`afternoon` entry persisted with `workout_details="20 min walk"`; `evening` entry persisted with `steps_walked_evening=3200`. Both read back.
- **Test log:** `workout`/`steps` fields persisted & queryable.

### 9. Daily mood check-in
`evening` entry persisted with `day_rating=8` (within valid range 1-10; the P2 suite separately verified `day_rating>10` is rejected). Read back.
- **Test log:** `F6/F7/F8/F9/F10 submit evening check-in | rating=8`; `day_rating=8` persisted.

### 10. Medication adherence flag (per check-in)
`meds_taken` boolean persisted on both morning and evening check-ins and read back via `/parents/<id>/health-logs`.
- **Test log:** `F6-F10 all check-in sub-fields persisted` includes `meds_taken=True`.

### 11. Graph updates after new entries
After submitting all three periods for today, `GET /parents/<id>/health-logs` returns entries for `morning`, `afternoon`, `evening` (graph source data ready); `GET /parents/<id>/health-logs/<date>/morning` returns the specific record with `hours_slept=7.5`. The frontend graph components consume exactly these endpoints.
- **Test logs:** `F11 graph source has morning/afternoon/evening entries`, `F11 single log by date+period | hours_slept=7.5`.

### 14. Reports generation
`POST /reports/generate {"report_type":"weekly"}` returns `200` with `content` containing `Parent: Pete Parent`, `Avg sleep: 7.5h`, `Avg day rating: 8.0/10`, generated from the live health logs (P2 already verified weekly/monthly from real data; this run re-confirms against the just-created logs).
- **Test log:** `F14 report generated from real health data incl. check-ins | Parent: Pete Parent, Avg sleep: 7.5h, Avg day rating: 8.0/10`.

### 15. AI Assistant using the latest health data
Parent-mode `POST /ai/chat` to `/ai/chat` (parent asking about last night's sleep, after the 7.5h sleep log was just recorded) returns a reply that **cites the live data** — `"I looked through your recent check-ins… You're averaging **7.50 hours** of sleep"` — plus a structured `insight` object `{kind:"sleep", title:"Average sleep (recent)", value:"7.5h"}`. The AI service (`ai_service.py`) builds the prompt context from `_recent_logs(...)` (last 14 days) + active medicines + legacy answers, so it is genuinely data-grounded (the fallback generator parses sleep/rating out of the context; with a `GROQ_API_KEY` set the LLM uses all fields).
- **Test logs:** `F15 AI reply references recent sleep data (avg sleep hours present)`, `F15 AI returns a structured insight object`.

### 16. Family synchronization across accounts
Child and parent share the same `family_id`; the child's `/families/me/members` + `/families/parents` lists include the parent, and vice-versa. Confirms the family graph is consistent across both roles in real time.
- **Test logs:** `F16 child & parent share same family id`, `F16 child dashboard lists the parent`.

---

## 4. Harness Notes (not app defects)
- SQLite stores booleans as `0`/`1`, so `is_active` is read as integer `1` — assertions used `bool(...)` in the harness.
- `PRAGMA table_info` returns positional rows; the harness switched to a raw tuple cursor to read column names.
- All three FAILs are reproducible, deterministic, and confirmed against the DB — they are real functional gaps, not harness artifacts.

## 5. Final Tally
**14 features PASS, 3 FAIL (2 root causes): "no notification delivery" (#12, #13) and "no medication-reminder engine" (#17).** A single fix effort (implement the notification publisher + wire a background scheduler, recommended in #12/#17) resolves all three. No other functional regressions were observed across onboarding, auth, check-ins (all fields), dashboards, graphs, reports, AI, or family sync.
