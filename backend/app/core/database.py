"""SQLAlchemy database engine, session, and base class."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine_kwargs: dict = {}
if settings.is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import (  # noqa: F401
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

    Base.metadata.create_all(bind=engine)
