"""In-memory rate limiting and login lockout.

Dev-grade protection for unauthenticated routes (auth, OTP, password reset).
In a multi-process production deployment this must be replaced with a shared
store (Redis), but it is correct for the current single-process deployment.
"""
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status

from app.core.config import settings

MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 15 * 60
LOCKOUT_SECONDS = 15 * 60

_requests: dict[str, list[float]] = defaultdict(list)
_failed_logins: dict[str, list[float]] = defaultdict(list)
_lockout_until: dict[str, float] = {}
_lock = Lock()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(
    request: Request,
    *,
    key: str | None = None,
    limit: int | None = None,
) -> None:
    """Reject the request when too many calls hit this key within a minute."""
    limit = limit or settings.RATE_LIMIT_REQUESTS_PER_MINUTE
    bucket = f"{_client_ip(request)}:{key}" if key else _client_ip(request)
    now = time.monotonic()
    with _lock:
        hits = [t for t in _requests[bucket] if now - t < 60.0]
        _requests[bucket] = hits
        if len(hits) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        _requests[bucket].append(now)


def is_locked(email: str) -> None:
    """Raise 429 when the email is currently locked out."""
    now = time.monotonic()
    with _lock:
        until = _lockout_until.get(email.lower(), 0.0)
        if now < until:
            remaining_minutes = max(1, int((until - now) // 60))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed attempts. Please try again in {remaining_minutes} minute(s).",
            )


def record_failure(email: str) -> None:
    email = email.lower()
    now = time.monotonic()
    with _lock:
        attempts = [t for t in _failed_logins[email] if now - t < LOGIN_WINDOW_SECONDS]
        attempts.append(now)
        _failed_logins[email] = attempts
        if len(attempts) >= MAX_LOGIN_ATTEMPTS:
            _lockout_until[email] = now + LOCKOUT_SECONDS
            _failed_logins.pop(email, None)


def record_success(email: str) -> None:
    email = email.lower()
    with _lock:
        _failed_logins.pop(email, None)
        _lockout_until.pop(email, None)
