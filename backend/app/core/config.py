"""Application configuration loaded from environment variables."""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

_WEAK_SECRETS = {"dev-secret-change-me", "dev-otp-secret-change-me"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "Parently API"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'database' / 'parently.db').as_posix()}"
    TEST_DATABASE_URL: str = "sqlite:///:memory:"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    # JWT
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # OTP
    OTP_SECRET: str = "dev-otp-secret-change-me"
    OTP_EXPIRE_MINUTES: int = 10

    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    # ChromaDB
    CHROMADB_HOST: str = ""
    CHROMADB_PORT: int = 8000
    CHROMADB_PATH: str = ""
    CHROMADB_COLLECTION_PREFIX: str = "parently"

    # Embeddings
    EMBEDDING_MODEL: str = "nomic-embed-text-v1.5"
    EMBEDDING_DIMENSION: int = 768

    # Redis / Celery
    REDIS_URL: str = ""
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""

    # APScheduler
    SCHEDULER_TIMEZONE: str = "UTC"

    # Email - Resend (legacy)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Parently <onboarding@resend.dev>"
    RESEND_FROM_NAME: str = "Parently"

    # Email - SMTP / Brevo
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "Parently <parently.care@gmail.com>"

    @property
    def email_from_address(self) -> str:
        """Extract the email address from EMAIL_FROM (handles 'Name <addr>' format)."""
        import re
        match = re.search(r"<([^>]+)>", self.EMAIL_FROM)
        return match.group(1) if match else self.EMAIL_FROM

    @property
    def email_from_name(self) -> str:
        """Extract the display name from EMAIL_FROM (handles 'Name <addr>' format)."""
        import re
        match = re.match(r"^([^<]+)\s*<", self.EMAIL_FROM.strip())
        return match.group(1).strip() if match else "Parently"

    # SMS - Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Push - FCM / Firebase Admin
    FCM_SERVER_KEY: str = ""
    FCM_SENDER_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = ""

    # Object storage - Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    # Frontend base URL for email links
    FRONTEND_URL: str = "http://localhost:5174"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @model_validator(mode="after")
    def _validate_secrets(self) -> "Settings":
        if self.ENVIRONMENT == "development":
            return self
        if len(self.JWT_SECRET) < 32 or self.JWT_SECRET in _WEAK_SECRETS:
            raise ValueError(
                "JWT_SECRET must be at least 32 characters and not the default value "
                "when ENVIRONMENT != development"
            )
        if self.OTP_SECRET in _WEAK_SECRETS:
            raise ValueError("OTP_SECRET must be changed when ENVIRONMENT != development")
        return self

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def celery_broker(self) -> str:
        return self.CELERY_BROKER_URL or self.REDIS_URL or "memory://"

    @property
    def celery_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL or "cache+memory://"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
