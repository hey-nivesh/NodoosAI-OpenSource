import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Primary Async Engine (PostgreSQL / Supabase)
engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args={"timeout": 5} # 5 second timeout before falling back
)

# Fallback Async Engine (Local SQLite) for offline/network issues
sqlite_url = "sqlite+aiosqlite:///./nodoos_fallback.db"
sqlite_engine = create_async_engine(
    sqlite_url,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_active_engine():
    """Tests if primary Postgres engine works; if not, returns SQLite fallback engine."""
    try:
        async with engine.connect() as conn:
            return engine
    except Exception as e:
        print(f"⚠️ Could not connect to remote Postgres DB ({e}). Using local SQLite fallback database.")
        AsyncSessionLocal.configure(bind=sqlite_engine)
        return sqlite_engine

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
