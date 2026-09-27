"""Celery Beat periodic schedule.

Beat persists its schedule state in a local SQLite (`celerybeat-schedule`)
so scheduled jobs survive worker restarts. Daily tasks use crontab so they
fire at fixed wall-clock times rather than every-N-hours from worker boot.
"""
from celery.schedules import crontab

# All times UTC. Localise at your deployment timezone or via settings.SCHEDULER_TIMEZONE.
beat_schedule = {
    # Health-check-in reminders at the start of each window
    "daily-checkin-morning": {
        "task": "parently.reminders.daily_checkins",
        "schedule": crontab(hour=7, minute=0),
    },
    "daily-checkin-afternoon": {
        "task": "parently.reminders.daily_checkins",
        "schedule": crontab(hour=12, minute=0),
    },
    "daily-checkin-evening": {
        "task": "parently.reminders.daily_checkins",
        "schedule": crontab(hour=17, minute=0),
    },
    # Medication reminders every hour during waking hours
    "medication-reminders": {
        "task": "parently.reminders.medications",
        "schedule": crontab(minute=0),
    },
    # Missed-medication escalation checks
    "missed-medication-alerts": {
        "task": "parently.reminders.missed_medications",
        "schedule": crontab(minute=0),
    },
    # End-of-day missed-check-in sweep
    "missed-checkin-alerts": {
        "task": "parently.reminders.missed_checkins",
        "schedule": crontab(hour=21, minute=0),
    },
    # Weekly report generation (Sunday 06:00 UTC)
    "weekly-reports": {
        "task": "parently.reports.weekly",
        "schedule": crontab(hour=6, minute=0, day_of_week=0),
    },
}
