"""
Live Signals + Support Contact routes:
  GET  /api/signals/live     — recent anomaly detections (30s poll)
  POST /api/support/contact  — contact form via Resend
"""
import logging
from datetime import datetime, timedelta
from typing import Tuple
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from db.session import get_db
from db.models import FactProductUsage, ChurnRescueAction
from api.auth_middleware import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)
signals_router = APIRouter(prefix="/api/signals", tags=["signals"])
support_router = APIRouter(prefix="/api/support", tags=["support"])


@signals_router.get("/live")
async def get_live_signals(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns recent anomaly detections for the Live Signals feed.
    Pulls the 30 most recent churn rescue actions created in the last 7 days.
    Frontend should poll this every 30 seconds.
    """
    _, org_id = current_user

    since = datetime.utcnow() - timedelta(days=7)

    result = await db.execute(
        select(ChurnRescueAction)
        .where(
            ChurnRescueAction.org_id == org_id,
            ChurnRescueAction.created_at >= since,
        )
        .order_by(desc(ChurnRescueAction.created_at))
        .limit(30)
    )
    signals = result.scalars().all()

    return {
        "signals": [
            {
                "id": str(s.action_id),
                "account_id": s.account_id,
                "account_name": s.account_name,
                "usage_drop_pct": float(s.usage_drop_pct),
                "root_cause": s.root_cause,
                "recommended_playbook": s.recommended_playbook,
                "action_status": s.action_status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in signals
        ],
        "fetched_at": datetime.utcnow().isoformat(),
    }


# ── Support Contact ────────────────────────────────────────────

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str


@support_router.post("/contact")
async def submit_contact_form(body: ContactRequest):
    """Sends a contact form message via Resend email."""
    if not settings.RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="Email service not configured")

    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": settings.NOTIFICATION_EMAIL_FROM,
            "to": settings.NOTIFICATION_EMAIL_TO,
            "subject": f"[Nodoos AI Support] Message from {body.name}",
            "html": f"""
            <h2>New Support Message</h2>
            <p><strong>Name:</strong> {body.name}</p>
            <p><strong>Email:</strong> {body.email}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>{body.message}</p>
            """,
        })
        logger.info(f"Support contact form submitted by {body.email}")
        return {"success": True, "message": "Your message has been sent. We'll get back to you shortly."}
    except Exception as e:
        logger.error(f"Failed to send support email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")
