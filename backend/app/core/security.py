"""Password hashing, JWT token helpers, and OTP code generation."""
from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import uuid4

import bcrypt
import jwt

from app.core.config import settings

TokenType = Literal["access", "refresh"]

_TokenKind = Literal["user", "parent"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _create_token(
    subject: str,
    token_type: TokenType,
    kind: _TokenKind,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "kind": kind,
        "iat": int(now.timestamp()),
        "exp": now + expires_delta,
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str, kind: _TokenKind = "user") -> str:
    return _create_token(
        subject,
        "access",
        kind,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: str, kind: _TokenKind = "user") -> str:
    return _create_token(
        subject,
        "refresh",
        kind,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str, token_type: TokenType) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != token_type:
        return None
    return payload


def generate_otp() -> str:
    import random

    return f"{random.SystemRandom().randint(0, 999999):06d}"
