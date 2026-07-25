"""
Account + Audit Trail routes:
  GET  /api/accounts/at-risk         — paginated, filterable at-risk list
  GET  /api/accounts/{account_id}    — full triage detail
  GET  /api/actions                  — paginated audit trail
  GET  /api/actions/export           — CSV stream
"""
import io
import csv
import logging
from datetime import datetime, date
from typing import Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_, or_
from db.session import get_db
from db.models import ChurnRescueAction, FactProductUsage, SupportTicket
from api.auth_middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["accounts"])


@router.get("/accounts/at-risk")
async def get_at_risk_accounts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    root_cause: Optional[str] = Query(None),
    min_arr: Optional[float] = Query(None),
    max_arr: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_dir: Optional[str] = Query("desc"),
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Paginated, filterable at-risk accounts — org-scoped."""
    _, org_id = current_user

    # Base query: latest action per account
    subq = (
        select(
            ChurnRescueAction.account_id,
            func.max(ChurnRescueAction.created_at).label("max_created"),
        )
        .where(ChurnRescueAction.org_id == org_id)
        .group_by(ChurnRescueAction.account_id)
        .subquery()
    )

    stmt = select(ChurnRescueAction).join(
        subq,
        and_(
            ChurnRescueAction.account_id == subq.c.account_id,
            ChurnRescueAction.created_at == subq.c.max_created,
        ),
    )

    # Filters
    if search:
        stmt = stmt.where(
            ChurnRescueAction.account_name.ilike(f"%{search}%")
        )
    if root_cause:
        causes = [c.strip() for c in root_cause.split(",")]
        stmt = stmt.where(ChurnRescueAction.root_cause.in_(causes))
    if min_arr is not None:
        stmt = stmt.where(ChurnRescueAction.arr >= min_arr)
    if max_arr is not None:
        stmt = stmt.where(ChurnRescueAction.arr <= max_arr)

    # Sort
    sort_col = getattr(ChurnRescueAction, sort_by, ChurnRescueAction.created_at)
    if sort_dir == "asc":
        stmt = stmt.order_by(sort_col.asc())
    else:
        stmt = stmt.order_by(sort_col.desc())

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar_one()

    # Paginate
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    res = await db.execute(stmt)
    actions = res.scalars().all()

    return {
        "accounts": [
            {
                "action_id": str(a.action_id),
                "account_id": a.account_id,
                "account_name": a.account_name,
                "arr": float(a.arr),
                "usage_drop_pct": float(a.usage_drop_pct),
                "root_cause": a.root_cause,
                "reasoning_summary": a.reasoning_summary,
                "recommended_playbook": a.recommended_playbook,
                "action_status": a.action_status,
                "slack_notification_sent": a.slack_notification_sent,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in actions
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page)),
    }


@router.get("/accounts/{account_id}")
async def get_account_detail(
    account_id: str,
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full triage detail: usage history, tickets, latest reasoning."""
    _, org_id = current_user

    # Latest action for this account
    action_res = await db.execute(
        select(ChurnRescueAction)
        .where(
            ChurnRescueAction.account_id == account_id,
            ChurnRescueAction.org_id == org_id,
        )
        .order_by(desc(ChurnRescueAction.created_at))
        .limit(1)
    )
    action = action_res.scalar_one_or_none()

    if not action:
        raise HTTPException(status_code=404, detail="Account not found or not at risk")

    # Usage history (last 60 days)
    usage_res = await db.execute(
        select(FactProductUsage)
        .where(
            FactProductUsage.account_id == account_id,
            FactProductUsage.org_id == org_id,
        )
        .order_by(FactProductUsage.metric_date.asc())
        .limit(60)
    )
    usage_rows = usage_res.scalars().all()

    # Support tickets
    tickets_res = await db.execute(
        select(SupportTicket)
        .where(
            SupportTicket.account_id == account_id,
            SupportTicket.org_id == org_id,
        )
        .order_by(desc(SupportTicket.created_at))
        .limit(10)
    )
    tickets = tickets_res.scalars().all()

    # All historical actions for this account
    history_res = await db.execute(
        select(ChurnRescueAction)
        .where(
            ChurnRescueAction.account_id == account_id,
            ChurnRescueAction.org_id == org_id,
        )
        .order_by(desc(ChurnRescueAction.created_at))
        .limit(10)
    )
    history = history_res.scalars().all()

    return {
        "account_id": account_id,
        "account_name": action.account_name,
        "arr": float(action.arr),
        "usage_drop_pct": float(action.usage_drop_pct),
        "root_cause": action.root_cause,
        "reasoning_summary": action.reasoning_summary,
        "recommended_playbook": action.recommended_playbook,
        "action_status": action.action_status,
        "usage_history": [
            {
                "date": u.metric_date.isoformat(),
                "active_users": u.active_users,
                "api_calls": u.api_calls,
                "feature_execution_count": u.feature_execution_count,
            }
            for u in usage_rows
        ],
        "support_tickets": [
            {
                "ticket_id": t.ticket_id,
                "subject": t.subject,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tickets
        ],
        "action_history": [
            {
                "action_id": str(h.action_id),
                "recommended_playbook": h.recommended_playbook,
                "action_status": h.action_status,
                "created_at": h.created_at.isoformat() if h.created_at else None,
            }
            for h in history
        ],
    }


@router.get("/actions")
async def get_actions_log(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    playbook: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Paginated, filterable audit trail — org-scoped."""
    _, org_id = current_user

    stmt = select(ChurnRescueAction).where(ChurnRescueAction.org_id == org_id)

    if search:
        stmt = stmt.where(ChurnRescueAction.account_name.ilike(f"%{search}%"))
    if playbook:
        stmt = stmt.where(ChurnRescueAction.recommended_playbook == playbook)
    if date_from:
        stmt = stmt.where(ChurnRescueAction.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        stmt = stmt.where(ChurnRescueAction.created_at <= datetime.combine(date_to, datetime.max.time()))

    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar_one()

    stmt = stmt.order_by(desc(ChurnRescueAction.created_at)).offset((page - 1) * per_page).limit(per_page)
    res = await db.execute(stmt)
    actions = res.scalars().all()

    return {
        "actions": [
            {
                "action_id": str(a.action_id),
                "account_id": a.account_id,
                "account_name": a.account_name,
                "arr": float(a.arr),
                "usage_drop_pct": float(a.usage_drop_pct),
                "root_cause": a.root_cause,
                "reasoning_summary": a.reasoning_summary,
                "recommended_playbook": a.recommended_playbook,
                "action_status": a.action_status,
                "slack_notification_sent": a.slack_notification_sent,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in actions
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page)),
    }


@router.get("/actions/export")
async def export_actions_csv(
    search: Optional[str] = Query(None),
    playbook: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Streams a CSV of the filtered audit trail."""
    _, org_id = current_user

    stmt = select(ChurnRescueAction).where(ChurnRescueAction.org_id == org_id)

    if search:
        stmt = stmt.where(ChurnRescueAction.account_name.ilike(f"%{search}%"))
    if playbook:
        stmt = stmt.where(ChurnRescueAction.recommended_playbook == playbook)
    if date_from:
        stmt = stmt.where(ChurnRescueAction.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        stmt = stmt.where(ChurnRescueAction.created_at <= datetime.combine(date_to, datetime.max.time()))

    stmt = stmt.order_by(desc(ChurnRescueAction.created_at))
    res = await db.execute(stmt)
    actions = res.scalars().all()

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "action_id", "account_id", "account_name", "arr",
            "usage_drop_pct", "root_cause", "recommended_playbook",
            "action_status", "slack_notification_sent", "created_at"
        ]
    )
    writer.writeheader()
    for a in actions:
        writer.writerow({
            "action_id": str(a.action_id),
            "account_id": a.account_id,
            "account_name": a.account_name,
            "arr": float(a.arr),
            "usage_drop_pct": float(a.usage_drop_pct),
            "root_cause": a.root_cause or "",
            "recommended_playbook": a.recommended_playbook,
            "action_status": a.action_status,
            "slack_notification_sent": a.slack_notification_sent,
            "created_at": a.created_at.isoformat() if a.created_at else "",
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=churn_rescue_audit.csv"},
    )
