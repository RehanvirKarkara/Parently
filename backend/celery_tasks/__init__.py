"""Parently background jobs (Celery).

Importable as `celery_tasks.celery_app` / `celery_tasks`. Run with:

    celery -A celery_tasks worker -B --loglevel=info

The Celery app, tasks, scheduler service and beat schedule live in this
package. See `celery_tasks/celery_app.py` for configuration.
"""
from .celery_app import celery_app  # noqa: F401

__all__ = ["celery_app"]
