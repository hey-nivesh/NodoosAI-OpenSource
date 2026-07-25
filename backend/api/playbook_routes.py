"""
Playbook rules matrix routes:
  GET   /api/playbooks        — read rules matrix (all users)
  PATCH /api/playbooks/{id}   — update rule (admin-only)
"""
import logging
from typing import Tuple, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import get_db
from db.models import PlaybookRule
from api.auth_middleware import get_current_user, get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/playbooks", tags=["playbooks"])

# Default rules matrix — seeded if no custom rules exist for the org
DEFAULT_RULES = [
    {
        "root_cause": "UNRESOLVED_CRITICAL_BUG",
        "arr_tier_label": "Enterprise (>$100k)",
        "arr_threshold_min": 100000,
        "arr_threshold_max": None,
        "playbook_name": "EXECUTIVE_ESCALATION",
        "description": "Escalate to executive team immediately for enterprise accounts with critical bugs",
    },
    {
        "root_cause": "ONBOARDING_FRICTION",
        "arr_tier_label": "Enterprise (>$100k)",
        "arr_threshold_min": 100000,
        "arr_threshold_max": None,
        "playbook_name": "DEDICATED_CSM_ASSIGNMENT",
        "description": "Assign a dedicated CSM for high-value accounts struggling with onboarding",
    },
    {
        "root_cause": "PRICE_SENSITIVITY",
        "arr_tier_label": "Enterprise (>$100k)",
        "arr_threshold_min": 100000,
        "arr_threshold_max": None,
        "playbook_name": "EXECUTIVE_DISCOUNT_REVIEW",
        "description": "Initiate executive-level pricing discussion for at-risk enterprise accounts",
    },
    {
        "root_cause": "LOW_FEATURE_ADOPTION",
        "arr_tier_label": "Enterprise (>$100k)",
        "arr_threshold_min": 100000,
        "arr_threshold_max": None,
        "playbook_name": "HIGH_TOUCH_CSM_OUTREACH",
        "description": "High-touch outreach and feature enablement workshop for enterprise accounts",
    },
    {
        "root_cause": "ANY",
        "arr_tier_label": "Growth ($10k–$100k)",
        "arr_threshold_min": 10000,
        "arr_threshold_max": 100000,
        "playbook_name": "AUTOMATED_NURTURE_SEQUENCE",
        "description": "Automated email nurture sequence with educational content and check-in",
    },
    {
        "root_cause": "ANY",
        "arr_tier_label": "Starter (<$10k)",
        "arr_threshold_min": 0,
        "arr_threshold_max": 10000,
        "playbook_name": "AUTOMATED_NURTURE_SEQUENCE",
        "description": "Automated nurture sequence for starter-tier accounts",
    },
    {
        "root_cause": "EMERGENCY",
        "arr_tier_label": "All Tiers",
        "arr_threshold_min": 0,
        "arr_threshold_max": None,
        "playbook_name": "EMERGENCY_INTERVENTION",
        "description": "Triggered when urgency score >= 8 regardless of ARR tier",
    },
]


@router.get("")
async def get_playbooks(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the rules matrix for the current org (or defaults if none set)."""
    _, org_id = current_user

    result = await db.execute(
        select(PlaybookRule)
        .where(PlaybookRule.org_id == org_id, PlaybookRule.is_active == True)
        .order_by(PlaybookRule.arr_threshold_min.desc())
    )
    rules = result.scalars().all()

    if rules:
        return {
            "playbooks": [
                {
                    "id": r.id,
                    "root_cause": r.root_cause,
                    "arr_tier_label": r.arr_tier_label,
                    "arr_threshold_min": float(r.arr_threshold_min),
                    "arr_threshold_max": float(r.arr_threshold_max) if r.arr_threshold_max else None,
                    "playbook_name": r.playbook_name,
                    "description": r.description,
                    "is_active": r.is_active,
                    "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                }
                for r in rules
            ],
            "source": "custom",
        }

    # Return defaults if no custom rules
    return {"playbooks": DEFAULT_RULES, "source": "default"}


class PlaybookUpdateRequest(BaseModel):
    playbook_name: Optional[str] = None
    arr_threshold_min: Optional[float] = None
    arr_threshold_max: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.patch("/{playbook_id}")
async def update_playbook(
    playbook_id: str,
    body: PlaybookUpdateRequest,
    current_user: Tuple[str, str] = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a playbook rule (admin-only)."""
    _, org_id = current_user

    result = await db.execute(
        select(PlaybookRule).where(
            PlaybookRule.id == playbook_id,
            PlaybookRule.org_id == org_id,
        )
    )
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(status_code=404, detail="Playbook rule not found")

    if body.playbook_name is not None:
        rule.playbook_name = body.playbook_name
    if body.arr_threshold_min is not None:
        rule.arr_threshold_min = body.arr_threshold_min
    if body.arr_threshold_max is not None:
        rule.arr_threshold_max = body.arr_threshold_max
    if body.description is not None:
        rule.description = body.description
    if body.is_active is not None:
        rule.is_active = body.is_active

    from datetime import datetime
    rule.updated_at = datetime.utcnow()

    await db.commit()
    logger.info(f"Playbook rule {playbook_id} updated by admin in org={org_id}")

    return {
        "id": rule.id,
        "playbook_name": rule.playbook_name,
        "arr_threshold_min": float(rule.arr_threshold_min),
        "arr_threshold_max": float(rule.arr_threshold_max) if rule.arr_threshold_max else None,
        "description": rule.description,
        "is_active": rule.is_active,
    }
