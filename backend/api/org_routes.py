"""
Organization + Team + Notifications routes:
  GET  /api/org/members          — team members list
  POST /api/org/invite           — invite teammate (Supabase Auth)
  GET  /api/notifications        — in-app notification list
  POST /api/notifications/{id}/read — mark notification as read
  POST /api/notifications/read-all  — mark all as read
"""
import logging
from typing import Tuple, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select, update, desc
from db.session import get_db
from db.models import Profile, Organization, Notification
from api.auth_middleware import get_current_user, get_current_admin
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["org"])


# ── Organization ──────────────────────────────────────────────

class OrgUpdateRequest(BaseModel):
    name: str


@router.get("/org")
async def get_org(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current org details."""
    _, org_id = current_user
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "id": org.id,
        "name": org.name,
        "created_at": org.created_at.isoformat() if org.created_at else None,
    }


@router.patch("/org")
async def update_org(
    body: OrgUpdateRequest,
    current_user: Tuple[str, str] = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update org name (admin-only)."""
    _, org_id = current_user
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.name = body.name
    await db.commit()
    return {"id": org.id, "name": org.name}


# ── Team Members ──────────────────────────────────────────────

@router.get("/org/members")
async def get_org_members(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all profiles in the current org."""
    _, org_id = current_user
    result = await db.execute(
        select(Profile).where(Profile.org_id == org_id)
    )
    members = result.scalars().all()

    return {
        "members": [
            {
                "id": m.id,
                "full_name": m.full_name,
                "role": m.role,
                "avatar_url": m.avatar_url,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in members
        ]
    }


class InviteRequest(BaseModel):
    email: EmailStr


@router.post("/org/invite")
async def invite_member(
    body: InviteRequest,
    current_user: Tuple[str, str] = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Invite a teammate via Supabase Auth invite link (admin-only)."""
    _, org_id = current_user

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        # pyrefly: ignore [missing-import]
        from supabase import create_client
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        # Supabase Admin API: invite user by email
        response = supabase.auth.admin.invite_user_by_email(
            body.email,
            options={"data": {"org_id": org_id, "role": "csm"}}
        )
        logger.info(f"Invited {body.email} to org={org_id}")
        return {"success": True, "message": f"Invitation sent to {body.email}"}
    except Exception as e:
        logger.error(f"Failed to invite user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send invite: {str(e)}")


# ── Notifications ─────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns in-app notifications for the current org."""
    _, org_id = current_user

    stmt = select(Notification).where(Notification.org_id == org_id)
    if unread_only:
        stmt = stmt.where(Notification.read == False)
    stmt = stmt.order_by(desc(Notification.created_at)).offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(stmt)
    notifs = result.scalars().all()

    # Unread count
    # pyrefly: ignore [missing-import]
    from sqlalchemy import func
    count_res = await db.execute(
        select(func.count()).where(
            Notification.org_id == org_id, Notification.read == False
        )
    )
    unread_count = count_res.scalar_one()

    return {
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "read": n.read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ],
        "unread_count": unread_count,
    }


@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    _, org_id = current_user

    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.org_id == org_id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.read = True
    await db.commit()
    return {"success": True}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the current org."""
    _, org_id = current_user

    await db.execute(
        update(Notification)
        .where(Notification.org_id == org_id, Notification.read == False)
        .values(read=True)
    )
    await db.commit()
    return {"success": True}
