"""Celery application factory for Parently background jobs.

Usage:
    celery -A celery_tasks.celery_app worker --loglevel=info
    celery -A celery_tasks.celery_app worker -B --loglevel=info   # with beat
    or via the convenience entrypoint:
    python -m celery_tasks.celery_app worker -B --loglevel=info
"""
import os

from celery import Celery

from app.core.config import settings

# Celery config keys are case-sensitive at config-from-object time; map the
# lowercase settings we already have (celery_broker / celery_backend) to the
# canonical Celery config keys.
celery_app = Celery(
    "parently",
    broker=settings.celery_broker,
    backend=settings.celery_backend,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone=settings.SCHEDULER_TIMEZONE,
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    task_acks_late=True,
    task_default_queue="parently",
    task_track_started=True,
)


# Import task module so Celery discovers the registered tasks.
from .tasks import *  # noqa: E402,F401,E403
from .beat_schedule import beat_schedule  # noqa: E402,F401,E403

celery_app.conf.beat_schedule = beat_schedule
