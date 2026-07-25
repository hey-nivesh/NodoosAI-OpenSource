# pyrefly: ignore [missing-import]
import httpx
import logging
from decimal import Decimal
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select
from db.session import AsyncSessionLocal
from db.models import ChurnRescueAction, SlackIntegration, Notification
from api.encryption import decrypt_token
from app.config import settings
from agent.state import WorkflowState

logger = logging.getLogger(__name__)


def determine_playbook(arr: float, root_cause: str, urgency_score: int) -> str:
    """Rules matrix lookup to assign mitigation playbook."""
    if urgency_score and urgency_score >= 8:
        return "EMERGENCY_INTERVENTION"
    if arr >= 100000.0:
        if root_cause == "UNRESOLVED_CRITICAL_BUG":
            return "EXECUTIVE_ESCALATION"
        elif root_cause == "ONBOARDING_FRICTION":
            return "DEDICATED_CSM_ASSIGNMENT"
        elif root_cause == "PRICE_SENSITIVITY":
            return "EXECUTIVE_DISCOUNT_REVIEW"
        else:
            return "HIGH_TOUCH_CSM_OUTREACH"
    else:
        return "AUTOMATED_NURTURE_SEQUENCE"


async def get_org_slack_webhook(org_id: str, session: AsyncSession) -> str | None:
    """
    Looks up and decrypts the Slack webhook URL for the given org.
    Returns None if no integration exists.
    """
    if not org_id:
        # Fallback to global env var for legacy/demo use
        return settings.SLACK_WEBHOOK_URL

    result = await session.execute(
        select(SlackIntegration).where(SlackIntegration.org_id == org_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        return None

    try:
        # Use the stored webhook URL (doesn't need decryption — it's not the access token)
        return integration.incoming_webhook_url
    except Exception as e:
        logger.error(f"Failed to retrieve Slack webhook for org={org_id}: {e}")
        return None


async def send_slack_notification(
    webhook_url: str,
    account_name: str,
    arr: float,
    drop_pct: float,
    root_cause: str,
    playbook: str,
    summary: str,
) -> bool:
    """Fires Slack webhook notification. Returns True on success."""
    payload = {
        "text": f"🚨 *NODOOS AI — Churn Rescue Triggered*",
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"🚨 Churn Risk Alert: {account_name}"},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Account:* {account_name}"},
                    {"type": "mrkdwn", "text": f"*ARR:* ${arr:,.2f}"},
                    {"type": "mrkdwn", "text": f"*Usage Drop:* -{drop_pct:.1f}%"},
                    {"type": "mrkdwn", "text": f"*Root Cause:* `{root_cause}`"},
                    {"type": "mrkdwn", "text": f"*Playbook:* *{playbook.replace('_', ' ')}*"},
                ],
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Reasoning:*\n{summary[:500]}"},
            },
        ],
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json=payload, timeout=5.0)
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"Slack notification error: {e}")
        return False


async def send_resend_email(
    account_name: str, arr: float, drop_pct: float,
    root_cause: str, playbook: str, summary: str,
):
    """Sends email alert via Resend API."""
    if not settings.RESEND_API_KEY:
        return
    try:
        # pyrefly: ignore [missing-import]
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": settings.NOTIFICATION_EMAIL_FROM,
            "to": settings.NOTIFICATION_EMAIL_TO,
            "subject": f"[Nodoos AI] Churn Alert: {account_name} (${arr:,.0f} ARR)",
            "html": f"""
            <h2>Nodoos AI Churn Rescue Alert</h2>
            <p><strong>Account:</strong> {account_name}</p>
            <p><strong>ARR:</strong> ${arr:,.2f}</p>
            <p><strong>Usage Drop:</strong> {drop_pct:.1f}%</p>
            <p><strong>Root Cause:</strong> {root_cause}</p>
            <p><strong>Playbook:</strong> {playbook.replace('_', ' ')}</p>
            <hr />
            <p><strong>Reasoning:</strong><br />{summary}</p>
            """,
        })
    except Exception as e:
        logger.error(f"Resend email error: {e}")


async def playbook_trigger_agent_node(state: WorkflowState) -> WorkflowState:
    """
    Node 3: Determines playbook via rules matrix, logs action to DB,
    fires Slack webhook for the org's connected workspace (not global),
    and logs notification rows for in-app alerts.
    """
    flagged = state.get("flagged_accounts", [])
    org_id = state.get("org_id")
    processed_actions = []

    if not flagged:
        state["status"] = "WORKFLOW_COMPLETE"
        state["message"] = "No accounts flagged for churn risk."
        return state

    async with AsyncSessionLocal() as session:
        # Resolve org's Slack webhook once (not per-account)
        webhook_url = await get_org_slack_webhook(org_id, session)
        slack_connected = webhook_url is not None

        if not slack_connected and org_id:
            logger.warning(f"No Slack integration for org={org_id} — notifications will be in-app only")

        for acc in flagged:
            playbook = determine_playbook(
                acc["arr"],
                acc.get("root_cause", "UNKNOWN"),
                acc.get("urgency_score", 5),
            )
            acc["recommended_playbook"] = playbook
            acc["action_status"] = "TRIGGERED"

            slack_sent = False

            if slack_connected:
                slack_sent = await send_slack_notification(
                    webhook_url,
                    acc["account_name"],
                    acc["arr"],
                    acc["usage_drop_pct"],
                    acc.get("root_cause", "UNKNOWN"),
                    playbook,
                    acc.get("reasoning_summary", ""),
                )
                if not slack_sent:
                    logger.warning(f"Slack send failed for account={acc['account_name']} org={org_id}")

            await send_resend_email(
                acc["account_name"],
                acc["arr"],
                acc["usage_drop_pct"],
                acc.get("root_cause", "UNKNOWN"),
                playbook,
                acc.get("reasoning_summary", ""),
            )

            # Persist action
            action_record = ChurnRescueAction(
                org_id=org_id,
                account_id=acc["account_id"],
                account_name=acc["account_name"],
                arr=Decimal(str(acc["arr"])),
                usage_drop_pct=Decimal(str(acc["usage_drop_pct"])),
                root_cause=acc.get("root_cause"),
                reasoning_summary=acc.get("reasoning_summary"),
                recommended_playbook=playbook,
                action_status="TRIGGERED",
                slack_notification_sent=slack_sent,
            )
            session.add(action_record)

            # In-app notification
            if org_id:
                notif_type = "playbook_triggered" if slack_sent else (
                    "slack_not_connected" if not slack_connected else "slack_error"
                )
                notif = Notification(
                    org_id=org_id,
                    type=notif_type,
                    title=f"Churn rescue triggered for {acc['account_name']}",
                    body=f"Playbook: {playbook.replace('_', ' ')} | Drop: {acc['usage_drop_pct']:.1f}%",
                )
                session.add(notif)

            processed_actions.append({
                "account_id": acc["account_id"],
                "account_name": acc["account_name"],
                "arr": acc["arr"],
                "usage_drop_pct": acc["usage_drop_pct"],
                "root_cause": acc.get("root_cause"),
                "reasoning_summary": acc.get("reasoning_summary"),
                "recommended_playbook": playbook,
                "action_status": "TRIGGERED",
                "slack_notification_sent": slack_sent,
            })

        await session.commit()

    state["processed_actions"] = processed_actions
    state["status"] = "WORKFLOW_COMPLETE"
    state["message"] = f"Processed churn rescue playbooks for {len(processed_actions)} account(s)."
    return state
