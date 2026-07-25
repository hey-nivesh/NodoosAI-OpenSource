import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nodoos"

    # ── LLM ──────────────────────────────────────────────────
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # ── Supabase ──────────────────────────────────────────────
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None   # used for local JWT verification

    # ── Slack OAuth (per-org) ─────────────────────────────────
    SLACK_CLIENT_ID: Optional[str] = None
    SLACK_CLIENT_SECRET: Optional[str] = None
    SLACK_TOKEN_ENCRYPTION_KEY: Optional[str] = None  # Fernet key — generate once
    SLACK_WEBHOOK_URL: Optional[str] = None            # legacy global fallback

    # ── Email (Resend) ────────────────────────────────────────
    RESEND_API_KEY: Optional[str] = None
    NOTIFICATION_EMAIL_FROM: str = "alerts@nodoos.ai"
    NOTIFICATION_EMAIL_TO: str = "csm-team@example.com"

    # ── Frontend / CORS ───────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000"  # comma-separated for prod

    # ── Observability ─────────────────────────────────────────
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: Optional[str] = None
    LANGCHAIN_PROJECT: str = "nodoos-ai"

    # ── Rate Limiting ─────────────────────────────────────────
    RATE_LIMIT_DEFAULT: str = "60/minute"
    RATE_LIMIT_AGENT: str = "5/minute"
    RATE_LIMIT_SLACK_OAUTH: str = "10/minute"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

settings = Settings()
