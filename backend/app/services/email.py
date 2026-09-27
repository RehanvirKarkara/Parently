"""Transactional email via SMTP (Brevo). Falls back to console logging in dev."""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_SERVER and settings.SMTP_USERNAME and settings.SMTP_PASSWORD)


def send_email(to: str, subject: str, text: str, html: str | None = None) -> bool:
    if not _smtp_configured():
        logger.info("[email:dev] To=%s Subject=%r\n%s", to, subject, text)
        return False

    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.sendmail(settings.email_from_address, to, msg.as_string())
        return True
    except (smtplib.SMTPException, OSError) as exc:
        logger.warning("SMTP email failed: %s", exc)
        return False


def email_sender_configured() -> bool:
    return _smtp_configured()
