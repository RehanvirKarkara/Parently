#!/usr/bin/env python
"""Convenience entrypoint for running the Parently Celery worker + beat.

    python celery_worker.py            # worker only
    python celery_worker.py -B         # worker + beat (scheduled jobs)
    python celery_worker.py -B --loglevel=info

This mirrors `celery -A celery_tasks worker` but keeps the package importable
from the repo root. Requires a Redis broker (set CELERY_BROKER_URL / REDIS_URL).
"""
from celery_tasks.celery_app import celery_app

if __name__ == "__main__":
    import sys

    argv = sys.argv[1:]
    if not argv:
        argv = ["worker", "--loglevel=info"]
    celery_app.start(argv=["celery"] + argv)
