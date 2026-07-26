"""
Slack OAuth routes:
  GET  /api/slack/authorize-url  — returns the Slack OAuth URL + CSRF state
  GET  /api/slack/callback       — exchanges code, stores integration
  GET  /api/slack/integration    — current org's connection status
  DELETE /api/slack/integration  — disconnect Slack for org
"""
import os
import secrets
import logging
# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Request, Query
# pyrefly: ignore [missing-import]
from fastapi.responses import RedirectResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select
from db.session import get_db
from db.models import SlackIntegration
from api.auth_middleware import get_current_user
from api.encryption import encrypt_token, decrypt_token
from app.config import settings
from typing import Tuple

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/slack", tags=["slack"])

# In-memory CSRF state store (use Redis in production for multi-instance)
_csrf_states: dict[str, str] = {}


@router.get("/authorize-url")
async def get_slack_authorize_url(
    request: Request,
    current_user: Tuple[str, str] = Depends(get_current_user),
):
    """Returns the Slack OAuth v2 authorize URL with a CSRF-safe state token."""
    user_id, org_id = current_user

    state = secrets.token_urlsafe(32)
    _csrf_states[state] = org_id  # tie state to org

    if not settings.SLACK_CLIENT_ID:
        logger.info(f"SLACK_CLIENT_ID not configured. Returning Mock Slack OAuth redirect for org={org_id}")
        backend_base = settings.BACKEND_URL or str(request.base_url).rstrip("/")
        mock_url = f"{backend_base}/api/slack/callback?code=mock_code_123&state={state}"
        return {"url": mock_url, "state": state, "mock": True}

    backend_base = settings.BACKEND_URL or str(request.base_url).rstrip("/")
    redirect_uri = f"{backend_base}/api/slack/callback"
    scopes = "incoming-webhook,chat:write"

    url = (
        f"https://slack.com/oauth/v2/authorize"
        f"?client_id={settings.SLACK_CLIENT_ID}"
        f"&scope={scopes}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
    )

    return {"url": url, "state": state}


@router.get("/callback")
async def slack_oauth_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Handles Slack's redirect after user authorizes the app.
    Exchanges code for access token, encrypts it, upserts into slack_integrations.
    """
    # Verify CSRF state
    org_id = _csrf_states.pop(state, None)
    if not org_id:
        logger.warning(f"Slack OAuth CSRF state mismatch: {state}")
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    # Handle Mock flow fallback
    if code.startswith("mock_"):
        logger.info(f"Processing mock Slack OAuth callback for org={org_id}")
        access_token = "xoxb-mock-token-12345"
        team_id = "T_MOCK_123"
        team_name = "Mock Workspace (Dev Mode)"
        webhook_url = settings.SLACK_WEBHOOK_URL or "https://hooks.slack.com/services/mock/webhook"
        channel = "alerts"
    else:
        if not settings.SLACK_CLIENT_ID or not settings.SLACK_CLIENT_SECRET:
            raise HTTPException(status_code=503, detail="Slack credentials not configured")

        backend_base = settings.BACKEND_URL or str(request.base_url).rstrip("/")
        redirect_uri = f"{backend_base}/api/slack/callback"

        # Exchange code for access token
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data={
                    "client_id": settings.SLACK_CLIENT_ID,
                    "client_secret": settings.SLACK_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                timeout=10.0,
            )

        data = resp.json()
        if not data.get("ok"):
            logger.error(f"Slack OAuth token exchange failed: {data.get('error')}")
            raise HTTPException(status_code=400, detail=f"Slack OAuth failed: {data.get('error')}")

        access_token = data["access_token"]
        team_id = data["team"]["id"]
        team_name = data["team"]["name"]
        webhook_url = data.get("incoming_webhook", {}).get("url", "")
        channel = data.get("incoming_webhook", {}).get("channel", "")

        if not webhook_url:
            raise HTTPException(status_code=400, detail="No incoming webhook in Slack response")

    # Encrypt the access token before storing
    encrypted_token = encrypt_token(access_token)

    logger.info(f"Slack OAuth success: org={org_id} team={team_name}")

    # Upsert into slack_integrations
    result = await db.execute(
        select(SlackIntegration).where(SlackIntegration.org_id == org_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.team_id = team_id
        existing.team_name = team_name
        existing.access_token_encrypted = encrypted_token
        existing.incoming_webhook_url = webhook_url
        existing.default_channel = channel
    else:
        integration = SlackIntegration(
            org_id=org_id,
            team_id=team_id,
            team_name=team_name,
            access_token_encrypted=encrypted_token,
            incoming_webhook_url=webhook_url,
            default_channel=channel,
        )
        db.add(integration)

    await db.commit()

    # Redirect to success page
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/onboarding/success")


@router.get("/integration")
async def get_slack_integration(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns current org's Slack connection status."""
    _, org_id = current_user

    result = await db.execute(
        select(SlackIntegration).where(SlackIntegration.org_id == org_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        return {"connected": False}

    return {
        "connected": True,
        "team_name": integration.team_name,
        "team_id": integration.team_id,
        "default_channel": integration.default_channel,
        "connected_at": integration.connected_at.isoformat() if integration.connected_at else None,
    }


@router.delete("/integration")
async def disconnect_slack(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnects Slack for the org."""
    _, org_id = current_user

    result = await db.execute(
        select(SlackIntegration).where(SlackIntegration.org_id == org_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(status_code=404, detail="No Slack integration found")

    await db.delete(integration)
    await db.commit()

    logger.info(f"Slack disconnected for org={org_id}")
    return {"success": True, "message": "Slack disconnected"}
