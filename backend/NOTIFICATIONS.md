# Notification & Reminder System

Celery + Redis powered scheduled reminders, event-based notifications, email
delivery, and a secured Notification Center.

## Architecture

- **Scheduler** (`celery_tasks/scheduler.py`) — broker-free, unit-testable in
  process. Builds the list of due reminders and calls `push_parent` for each.
  Idempotent via `dedup_key` + `notification_exists`.
- **Celery tasks** (`celery_tasks/tasks.py`) — 5 tasks wrapped with retry/error
  policy: `notifications.email`, `reminders.daily_checkins`,
  `reminders.medications`, `reminders.missed_medications`,
  `reminders.missed_checkins`, `reports.weekly`.
- **Event hooks** — wired into `auth.py`, `families.py`, `health.py`,
  `medicines.py`, `reports.py` via the existing
  `app/services/notification.py` (`create_notification` /
  `notify_all_children` / `push_parent`).

No backend or frontend API contract changes; notifications are in-app + email.

## Scheduled jobs (UTC)

| Job | Schedule | Description |
|---|---|---|
| daily-checkin-morning | `0 7 * * *` | Check-in reminder (morning) |
| daily-checkin-afternoon | `0 12 * * *` | Check-in reminder (afternoon) |
| daily-checkin-evening | `0 17 * * *` | Check-in reminder (evening) |
| medication-reminders | `*/30 * * * *` | Med reminder within 30min of scheduled time |
| missed-medication-alerts | `0 * * * *` | Escalate med due >3h (escalation), >8h (urgent) |
| missed-checkin-alerts | `0 21 * * *` | Child missed all 3 check-ins today |
| weekly-reports | `0 6 * * 0` | Weekly report generated + emailed |

## Event notifications

| Trigger | Type | Category | Recipient |
|---|---|---|---|
| Parent activates invite | `parent_joined` | `parent_invite` | child |
| Parent accepts invite | `invitation_accepted` | `parent_invite` | child |
| Child check-in submitted | `checkin_completed` | `check_in` | child |
| Medication added | `medicine_added` | `medication` | parent |
| Medication updated | `medicine_updated` | `medication` | parent |
| Medication removed | `medicine_removed` | `medication` | parent |
| Weekly report generated | `new_report` | `report` | child |

## Local dev (with Redis)

```bash
# 1. install + start redis
pip install -r backend/requirements.txt   # celery included
redis-server                               # localhost:6379

# 2. set .env (backend/)
REDIS_URL=redis://localhost:6379/0
# (CELERY_BROKER_URL / CELERY_RESULT_BACKEND optional; fall back to REDIS_URL)

# 3. start backend + worker
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
.venv/bin/python celery_worker.py -B --loglevel=info     # worker + beat

# 4. (optional) send a task manually
.venv/bin/python -c "from celery_tasks.celery_app import celery_app; from celery_tasks.tasks import send_notification_email; send_notification_email.delay(<user_id>, <body>)"
```

## Local dev (without Redis)

The scheduler is broker-free and can be invoked in-process for tests/manual
runs:

```bash
.venv/bin/python -c "from app.core.database import SessionLocal; import celery_tasks.scheduler as s; s.daily_checkins(SessionLocal())"
```

Email is delivered through the existing Brevo SMTP service in
`app/services/email.py`. In dev without SMTP credentials configured, emails
log a warning and fall back to `email:dev` (no crash).

## Testing

```bash
.venv/bin/python -m pytest tests/test_notification_reminders.py -q
```

In-process suite (event notifications, scheduler dedup/idempotency, secured
endpoints, email delivery via a captured sink).
