"""OTP generation, persistence, and verification (parent invite, email verify, password reset)."""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_otp
from app.models import OTPCode
from app.services import email as email_service


def _now() -> datetime:
    return datetime.now(timezone.utc)


def issue_otp(db: Session, email: str, purpose: str) -> OTPCode:
    code = generate_otp()
    expires_at = _now() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    record = (
        db.query(OTPCode)
        .filter(OTPCode.email == email.lower(), OTPCode.purpose == purpose)
        .first()
    )
    if record:
        record.code = code
        record.expires_at = expires_at
    else:
        record = OTPCode(email=email.lower(), code=code, purpose=purpose, expires_at=expires_at)
        db.add(record)
    db.commit()
    db.refresh(record)
    return record


def verify_otp(db: Session, email: str, code: str, purpose: str) -> OTPCode:
    record = (
        db.query(OTPCode)
        .filter(
            OTPCode.email == email.lower(),
            OTPCode.purpose == purpose,
            OTPCode.code == code,
        )
        .first()
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That code doesn't match. Please check and try again.",
        )
    if record.expires_at.tzinfo is None:
        expires_at_aware = record.expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_at_aware = record.expires_at
    if expires_at_aware < _now():
        db.delete(record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This code has expired. Please request a new one.",
        )
    return record


def consume_otp(db: Session, record: OTPCode) -> None:
    db.delete(record)
    db.commit()


def clear_expired(db: Session) -> int:
    result = db.execute(delete(OTPCode).where(OTPCode.expires_at < _now()))
    db.commit()
    return result.rowcount or 0


def deliver(record: OTPCode, purpose: str) -> dict:
    subject = "Parently verification code"
    body = f"Your Parently verification code is {record.code}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    sent = email_service.send_email(record.email, subject, body)
    return {"success": True, "dev_code": record.code if not sent else None}
