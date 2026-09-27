"""Seed the database with demo data matching the frontend mock layer."""
import sys
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models import (
    AIConversation,
    Family,
    FamilyMember,
    HealthLog,
    LegacyAnswer,
    LegacyQuestion,
    Medicine,
    Notification,
    OTPCode,
    Parent,
    QuizAnswer,
    QuizQuestion,
    Report,
    User,
)


def seed(db: Session) -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    user = User(
        id="u-1",
        email="alex@parently.app",
        hashed_password=hash_password("password123"),
        first_name="Alex",
        last_name="Taylor",
        is_active=True,
        is_verified=True,
    )
    db.add(user)

    mom = Parent(
        id="p-mom",
        family_id="",
        first_name="Carol",
        last_name="Smith",
        email="carol@parently.app",
        hashed_password=hash_password("password123"),
        medical_conditions="Hypertension",
        allergies="Penicillin",
        date_of_birth=date(1958, 4, 12),
        is_active=True,
        blood_group="O+",
        avatar_color="brand",
    )
    dad = Parent(
        id="p-dad",
        family_id="",
        first_name="Robert",
        last_name="Smith",
        email="robert@parently.app",
        hashed_password=hash_password("password123"),
        medical_conditions="Type 2 Diabetes",
        allergies="None",
        date_of_birth=date(1955, 11, 3),
        is_active=True,
        blood_group="A+",
        avatar_color="green",
    )
    db.add_all([mom, dad])
    db.flush()

    family = Family(
        id="fam-1",
        name="Smith Family",
        created_by_user_id=user.id,
    )
    db.add(family)
    db.flush()

    mom.family_id = family.id
    dad.family_id = family.id
    db.flush()

    member = FamilyMember(
        id="fm-1",
        family_id=family.id,
        user_id=user.id,
        role="creator",
        joined_at=now,
        is_active=True,
    )
    db.add(member)

    # Health logs for the past 7 days
    for i in range(7):
        log_date = date.today() - timedelta(days=i)
        morning = HealthLog(
            parent_id=mom.id,
            log_date=log_date,
            log_time_of_day="morning",
            hours_slept=round(6.5 + (i % 3) * 0.5, 2),
            meds_taken=True,
            breakfast_details="Oatmeal and tea",
        )
        afternoon = HealthLog(
            parent_id=mom.id,
            log_date=log_date,
            log_time_of_day="afternoon",
            lunch_details="Salad and soup",
            steps_walked_afternoon=2000 + i * 100,
            workout_details="Light stretching",
        )
        evening = HealthLog(
            parent_id=mom.id,
            log_date=log_date,
            log_time_of_day="evening",
            snacks_dinner_details="Soup and bread",
            steps_walked_evening=1500,
            day_rating=8 if i % 2 == 0 else 7,
        )
        db.add_all([morning, afternoon, evening])

    # Medicines
    med1 = Medicine(
        parent_id=mom.id,
        name="Lisinopril",
        dosage="10mg",
        frequency="Once daily",
        instructions="Take with water in the morning",
        start_date=date.today() - timedelta(days=180),
        is_active=True,
        time="08:00",
        color="brand",
    )
    med2 = Medicine(
        parent_id=mom.id,
        name="Metformin",
        dosage="500mg",
        frequency="Twice daily",
        instructions="Take with meals",
        start_date=date.today() - timedelta(days=365),
        is_active=True,
        time="08:00",
        color="green",
    )
    db.add_all([med1, med2])

    # Quiz questions
    q1 = QuizQuestion(
        id="q1",
        question_text="What is Mom's favorite flower?",
        category="general",
        options=["Roses", "Sunflowers", "Daisies", "Lilies"],
    )
    q2 = QuizQuestion(
        id="q2",
        question_text="What was Mom's first car?",
        category="childhood",
        options=["Toyota", "Honda", "Ford", "Chevrolet"],
    )
    db.add_all([q1, q2])

    # Legacy questions
    lq1 = LegacyQuestion(
        id="lq1",
        question_text="What is your happiest childhood memory?",
    )
    lq2 = LegacyQuestion(
        id="lq2",
        question_text="What advice would you give your younger self?",
    )
    db.add_all([lq1, lq2])

    # Legacy answers
    la1 = LegacyAnswer(
        id="la1",
        legacy_question_id=lq1.id,
        parent_id=mom.id,
        answer_text="I remember the summer we moved to our first house.",
        answered_at=now - timedelta(hours=2),
    )
    la2 = LegacyAnswer(
        id="la2",
        legacy_question_id=lq2.id,
        parent_id=mom.id,
        answer_text="Be kinder to yourself and take more risks.",
        answered_at=now - timedelta(hours=1),
    )
    db.add_all([la1, la2])

    # Reports
    report = Report(
        id="rep-1",
        family_id=family.id,
        report_type="weekly",
        report_period_start=date.today() - timedelta(days=7),
        report_period_end=date.today(),
        content="Weekly health report for Smith Family. Carol maintained consistent check-ins and medicine adherence.",
    )
    db.add(report)

    # Notifications
    notif1 = Notification(
        recipient_user_id=user.id,
        recipient_parent_id=None,
        type="missed_checkin_parent",
        message="Carol missed her afternoon check-in today.",
        is_read=False,
    )
    notif2 = Notification(
        recipient_user_id=user.id,
        recipient_parent_id=None,
        type="report_ready",
        message="Your weekly report is ready.",
        is_read=True,
    )
    notif3 = Notification(
        recipient_user_id=None,
        recipient_parent_id=mom.id,
        type="encouragement",
        title="Keep it up!",
        message="Great job keeping up with your check-ins this week.",
        is_read=False,
    )
    db.add_all([notif1, notif2, notif3])

    # AI conversation
    conv = AIConversation(
        user_id=user.id,
        parent_id=mom.id,
        conversation_type="offspring_chatbot",
        message_history=[
            {
                "id": "cm-1",
                "role": "user",
                "content": "How is Mom doing?",
                "timestamp": (now - timedelta(hours=2)).isoformat(),
            },
            {
                "id": "cm-2",
                "role": "assistant",
                "content": "Mom's health looks stable. Her sleep has been consistent and her day ratings are good.",
                "timestamp": (now - timedelta(hours=2)).isoformat(),
            },
        ],
    )
    db.add(conv)

    db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
