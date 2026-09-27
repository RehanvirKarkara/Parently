"""Functional tests for the Notification & Reminder system.

Run in-process (no Redis/Celery broker required): we call the scheduler
service functions and the FastAPI routes directly. Email sending is monkeypatched
to a capture sink so tests are hermetic (SMTP is configured in dev .env but we
avoid emitting real emails during tests).
"""
import datetime as dt
import uuid
from email.message import Message
from unittest import mock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

import celery_tasks.scheduler as scheduler
import app.services.email as email_service
from app.core.config import settings
from app.core.database import Base, get_db
from app.models import Family, FamilyMember, HealthLog, Medicine, Notification, Parent, User
from app.main import app

# --- DB setup: file-based sqlite reuse, but override get_db to a session ---
DB_PATH = settings.DATABASE_URL.replace("sqlite:///", "")
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@pytest.fixture
def client(db):
    def _get():
        return db
    app.dependency_overrides[get_db] = _get
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def capture_email(monkeypatch):
    captured = []

    def fake_send(to, subject, text, html=None):
        captured.append({"to": to, "subject": subject, "text": text})
        return True

    monkeypatch.setattr(email_service, "send_email", fake_send)
    return captured


def _register_and_login(client, email, password="password123", first_name="F", last_name="N"):
    r = client.post("/api/v1/auth/register", json={"email": email, "password": password, "first_name": first_name, "last_name": last_name})
    assert r.status_code == 200, r.text
    return r.json()["tokens"]["access_token"], r.json()["user"]["id"]


def _invite_and_activate_parent(client, child_token, parent_email):
    r = client.post("/api/v1/families/me/parents/invite", json={
        "first_name": "Pete", "last_name": "Parent", "email": parent_email,
        "date_of_birth": "1960-01-01", "medical_conditions": "n", "allergies": "n",
    }, headers={"Authorization": f"Bearer {child_token}"})
    assert r.status_code == 200, r.text
    code = db_sync_latest_code(parent_email, "parent_invite")
    r = client.post("/api/v1/auth/parent/register", json={"email": parent_email, "password": "pword12345"})
    assert r.status_code == 200, r.text
    tok = r.json()["tokens"]["access_token"]
    r = client.post("/api/v1/auth/parent/activate", json={"code": code}, headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200, r.text


def db_sync_latest_code(email, purpose):
    s = TestingSession()
    row = s.execute(select(__import__("app.models", fromlist=["OTPCode"]).OTPCode.code).where(
        __import__("app.models", fromlist=["OTPCode"]).OTPCode.email == email,
        __import__("app.models", fromlist=["OTPCode"]).OTPCode.purpose == purpose).order_by(
        __import__("app.models", fromlist=["OTPCode"]).OTPCode.created_at.desc())).first()
    s.close()
    return row[0] if row else None


FE = lambda tag: f"notif_test_{tag}_{uuid.uuid4().hex[:6]}@qa-parently.com"  # noqa: E731


def cnt(db, stmt):
    return len(db.execute(stmt).scalars().all())


# --------------------------------------------------------------------------- #
# Event-based notifications
# --------------------------------------------------------------------------- #
class TestEventNotifications:
    def test_checkin_completes_creates_notification_for_child(self, client, db):
        tok, uid = _register_and_login(client, FE("child"))
        p_email = FE("parent")
        _invite_and_activate_parent(client, tok, p_email)
        parent = db.execute(select(Parent).where(Parent.email == p_email)).scalar_one()

        before = cnt(db, select(Notification).where(Notification.recipient_user_id == uid))
        r = client.post("/api/v1/health-logs", json={
            "parent_id": parent.id, "log_date": dt.date.today().isoformat(),
            "log_time_of_day": "morning", "hours_slept": 8, "meds_taken": True,
            }, headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200, r.text
        after = cnt(db, select(Notification).where(Notification.recipient_user_id == uid))
        assert after == before + 1
        notif = db.scalars(select(Notification).where(
            Notification.recipient_user_id == uid, Notification.type == "checkin_completed"
        ).order_by(Notification.sent_at.desc())).first()
        assert notif is not None
        assert notif.category == "check_in"

    def test_checkin_update_does_not_duplicate_notification(self, client, db):
        tok, uid = _register_and_login(client, FE("child2"))
        p_email = FE("parent2")
        _invite_and_activate_parent(client, tok, p_email)
        parent = db.execute(select(Parent).where(Parent.email == p_email)).scalar_one()
        body = {"parent_id": parent.id, "log_date": dt.date.today().isoformat(),
                "log_time_of_day": "morning", "hours_slept": 6, "meds_taken": True}
        r1 = client.post("/api/v1/health-logs", json=body, headers={"Authorization": f"Bearer {tok}"})
        assert r1.status_code == 200
        r2 = client.post("/api/v1/health-logs", json=body, headers={"Authorization": f"Bearer {tok}"})
        assert r2.status_code == 200  # upsert, not duplicate
        count = cnt(db, select(Notification).where(Notification.recipient_user_id == uid, Notification.type == "checkin_completed"))
        assert count == 1, "dedup: upsert must not send a second notification"

    def test_parent_joined_notification(self, client, db):
        tok, uid = _register_and_login(client, FE("child3"))
        p_email = FE("parent3")
        _invite_and_activate_parent(client, tok, p_email)
        parent = db.execute(select(Parent).where(Parent.email == p_email)).scalar_one()
        joined = db.execute(select(Notification).where(
            Notification.recipient_user_id == uid, Notification.type == "parent_joined")).all()
        assert joined, "parent_joined notification sent to child"
        accepted = db.execute(select(Notification).where(
            Notification.recipient_parent_id == parent.id, Notification.type == "invitation_accepted")).all()
        assert accepted, "invitation_accepted notification sent to parent"

    def test_medicine_added_update_removed_notifications(self, client, db):
        tok, _ = _register_and_login(client, FE("child4"))
        p_email = FE("parent4")
        _invite_and_activate_parent(client, tok, p_email)
        parent = db.execute(select(Parent).where(Parent.email == p_email)).scalar_one()

        r = client.post("/api/v1/medicines", json={
            "parent_id": parent.id, "name": "Vitamin D", "dosage": "1000IU",
            "frequency": "daily", "time": "08:00"}, headers={"Authorization": f"Bearer {tok}"})
        med_id = r.json()["id"]
        r = client.patch(f"/api/v1/medicines/{med_id}", json={"dosage": "2000IU"},
                         headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        r = client.delete(f"/api/v1/medicines/{med_id}", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        types = {n.type for n in db.execute(select(Notification.type).where(
            Notification.recipient_parent_id == parent.id)).all()}
        assert {"medicine_added", "medicine_updated", "medicine_removed"} <= types, types

    def test_report_generated_notification(self, client, db):
        tok, uid = _register_and_login(client, FE("child5"))
        p_email = FE("parent5")
        _invite_and_activate_parent(client, tok, p_email)
        before = cnt(db, select(Notification).where(Notification.recipient_user_id == uid, Notification.type == "new_report"))
        r = client.post("/api/v1/reports/generate", json={"report_type": "weekly"},
                        headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200, r.text
        after = cnt(db, select(Notification).where(Notification.recipient_user_id == uid, Notification.type == "new_report"))
        assert after == before + 1


# --------------------------------------------------------------------------- #
# Scheduler service (in-process, no broker)
# --------------------------------------------------------------------------- #
class TestScheduler:
    def _setup_family(self, db):
        # Hermetic: always create a fresh child + family + parent.
        child = User(email=FE("sched_c"), hashed_password="x", first_name="C", last_name="N",
                     is_active=True, is_verified=True)
        db.add(child); db.commit(); db.refresh(child)
        fam = Family(name="Fam", created_by_user_id=child.id)
        db.add(fam); db.commit(); db.refresh(fam)
        db.add(FamilyMember(family_id=fam.id, user_id=child.id, role="child",
                            joined_at=dt.datetime.now(dt.timezone.utc), is_active=True))
        db.commit()
        parent = Parent(family_id=fam.id, first_name="Pete", last_name="P",
                        email=FE("sched_p"), hashed_password="x", is_active=True)
        db.add(parent); db.commit(); db.refresh(parent)
        return fam, child, parent

    def test_daily_checkin_reminder_issues_missing_periods(self, db):
        fam, child, parent = self._setup_family(db)
        d = dt.date.today()
        # only morning logged
        db.add(HealthLog(parent_id=parent.id, log_date=d, log_time_of_day="morning", hours_slept=7, created_at=dt.datetime.now(dt.timezone.utc), updated_at=dt.datetime.now(dt.timezone.utc)))
        db.commit()
        scheduler.daily_checkin_reminders(db, due_date=d)
        # afternoon + evening should be reminded for THIS parent only
        reminded = db.execute(select(Notification).where(
            Notification.recipient_parent_id == parent.id, Notification.type == "checkin_reminder"
        )).scalars().all()
        assert len(reminded) >= 2, f"expected >=2 reminders, got {len(reminded)}"
        assert any("afternoon" in (n.message or "") for n in reminded)
        assert any("evening" in (n.message or "") for n in reminded)

    def test_medication_reminder_issues_for_due_med(self, db):
        fam, child, parent = self._setup_family(db)
        med = Medicine(parent_id=parent.id, name="Insulin", dosage="10u", frequency="daily",
                       time=dt.datetime.utcnow().strftime("%H:%M"), start_date=dt.date.today(),
                       created_at=dt.datetime.now(dt.timezone.utc), updated_at=dt.datetime.now(dt.timezone.utc))
        db.add(med); db.commit()
        scheduler.medication_reminders(db)
        notif = db.execute(select(Notification).where(
            Notification.recipient_parent_id == parent.id, Notification.type == "med_reminder"
        )).scalars().first()
        assert notif is not None
        assert "Insulin" in (notif.title or notif.message)
        notif = db.execute(select(Notification).where(Notification.recipient_parent_id == parent.id, Notification.type == "med_reminder")).first()
        assert notif is not None

    def test_medication_reminders_dedup(self, db):
        fam, child, parent = self._setup_family(db)
        med = Medicine(parent_id=parent.id, name="Metformin", dosage="1x", frequency="daily",
                       time=dt.datetime.now(dt.timezone.utc).strftime("%H:%M"), start_date=dt.date.today(),
                      created_at=dt.datetime.now(dt.timezone.utc), updated_at=dt.datetime.now(dt.timezone.utc))
        db.add(med); db.commit()
        scheduler.medication_reminders(db)
        first = db.execute(select(Notification).where(
            Notification.recipient_parent_id == parent.id, Notification.type == "med_reminder")).scalars().all()
        scheduler.medication_reminders(db)
        second = db.execute(select(Notification).where(
            Notification.recipient_parent_id == parent.id, Notification.type == "med_reminder")).scalars().all()
        assert len(first) == 1, len(first)
        assert len(second) == 1, "dedup: second run must not re-create"

    def test_missed_checkin_alerts(self, db):
        fam, child, parent = self._setup_family(db)
        # parent has no check-in today
        scheduler.missed_checkin_alerts(db)
        notif = db.execute(select(Notification).where(
            Notification.recipient_parent_id == parent.id, Notification.type == "checkin_missed")).first()
        assert notif is not None

    def test_weekly_reports_for_all_families(self, db):
        fam, child, parent = self._setup_family(db)
        sent = scheduler.weekly_reports_for_all_families(db)
        assert sent >= 1, sent
        rep = db.execute(select(Notification).where(Notification.type == "weekly_report",
                    Notification.recipient_user_id == child.id)).first()
        assert rep is not None

    def test_scheduler_survives_repeated_runs(self, db):
        fam, child, parent = self._setup_family(db)
        scheduler.daily_checkin_reminders(db)
        # running again immediately should be a no-op due to dedup keys
        sent = scheduler.daily_checkin_reminders(db)
        assert sent == 0


# --------------------------------------------------------------------------- #
# Notification endpoints (auth + scoping)
# --------------------------------------------------------------------------- #
class TestNotificationEndpoints:
    def test_mark_read_requires_auth(self, client, db):
        r = client.post("/api/v1/notifications/abc/read")
        assert r.status_code == 401

    def test_mark_read_scoped_to_own_notifications(self, client, db):
        tok, uid = _register_and_login(client, FE("owner"))
        # inject a notification for another user
        other = User(email=FE("other"), hashed_password="x", first_name="O", last_name="N", is_active=True, is_verified=True)
        db.add(other); db.commit()
        nid = db.execute(select(Notification.id).where(Notification.recipient_user_id == other.id).order_by(Notification.sent_at.desc()).limit(1)).scalar()
        if not nid:
            from app.services.notification import create_notification
            n = create_notification(db, message="hi", type="system", recipient_user_id=other.id)
            nid = n.id
        r = client.post(f"/api/v1/notifications/{nid}/read", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 404  # not mine

    def test_unread_count_and_categories(self, client, db):
        from app.services.notification import create_notification
        tok, uid = _register_and_login(client, FE("cats"))
        create_notification(db, message="a", type="checkin_completed", recipient_user_id=uid, category="check_in")
        create_notification(db, message="b", type="med_reminder", recipient_parent_id=None, recipient_user_id=uid, category="medication")
        r = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json()["unread"] == 2
        r = client.get("/api/v1/notifications?category=medication", headers={"Authorization": f"Bearer {tok}"})
        assert len(r.json()) == 1


# --------------------------------------------------------------------------- #
# Email delivery
# --------------------------------------------------------------------------- #
class TestEmailDelivery:
    def test_email_service_reuses_brevo_path_and_sends(self, db, monkeypatch):
        captured = []
        monkeypatch.setattr(email_service, "send_email", lambda to, subj, text, html=None: (captured.append({"to": to, "subject": subj, "text": text}), True)[1])
        from app.services.notification import send_notification_email
        # create a notification for a parent and email it
        parent = db.query(Parent).first()
        assert parent, "need a parent fixture"
        from app.services.notification import create_notification
        n = create_notification(db, message="Reminder to take your meds", type="med_reminder", recipient_parent_id=parent.id, category="medication")
        ok = send_notification_email(db, n)
        assert ok is True
        assert captured[0]["to"] == parent.email
        assert "Reminder to take your meds" in captured[0]["text"]
