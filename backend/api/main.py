import os
import sys
import logging
import json
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Ensure backend root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.routes import router as legacy_router
from api.slack_routes import router as slack_router
from api.account_routes import router as account_router
from api.org_routes import router as org_router
from api.playbook_routes import router as playbook_router
from api.signals_routes import signals_router, support_router
from db.session import get_active_engine, AsyncSessionLocal
from db.models import Base
from db.seed import seed_data
from app.config import settings

# ── Structured JSON Logging ───────────────────────────────────

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers = [handler]

setup_logging()
logger = logging.getLogger(__name__)

# ── Rate Limiter ──────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Lifespan ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Nodoos AI backend service")
    active_engine = await get_active_engine()
    async with active_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        await seed_data()
    except Exception as e:
        logger.info(f"Seed info: {e}")
    yield
    logger.info("Shutting down Nodoos AI backend service")
    await active_engine.dispose()

# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="Nodoos AI Backend API",
    description="Autonomous Churn Rescue Agent Service powered by LangGraph & Supabase",
    version="3.0",
    lifespan=lifespan,
)

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────
allowed_origins = settings.allowed_origins_list
# Always include localhost for local dev
if "http://localhost:3000" not in allowed_origins:
    allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Request logging middleware ────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.utcnow()
    response = await call_next(request)
    duration_ms = (datetime.utcnow() - start).total_seconds() * 1000
    logger.info(json.dumps({
        "method": request.method,
        "path": str(request.url.path),
        "status": response.status_code,
        "duration_ms": round(duration_ms, 1),
    }))
    return response

# ── Routers ────────────────────────────────────────────────────
app.include_router(legacy_router)
app.include_router(slack_router)
app.include_router(account_router)
app.include_router(org_router)
app.include_router(playbook_router)
app.include_router(signals_router)
app.include_router(support_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
