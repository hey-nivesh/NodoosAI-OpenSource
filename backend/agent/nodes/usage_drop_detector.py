from datetime import date, timedelta
# pyrefly: ignore [missing-import]
from sqlalchemy import select, func, text
from db.session import AsyncSessionLocal
from db.models import FactProductUsage
from agent.state import WorkflowState, AccountRiskState

async def usage_drop_detector_node(state: WorkflowState) -> WorkflowState:
    """
    Node 1: Scans fact_product_usage using SQLAlchemy async to compare
    the 7-day moving average activity vs 28-day moving average.
    Flags accounts with > 20% drop in usage.
    """
    org_id = state.get("org_id")
    async with AsyncSessionLocal() as session:
        today = date.today()
        seven_days_ago = today - timedelta(days=7)
        twenty_eight_days_ago = today - timedelta(days=28)

        # Pull telemetry for this org (or all records if no org_id set)
        stmt = select(FactProductUsage)
        if org_id:
            stmt = stmt.where(
                (FactProductUsage.org_id == org_id) | (FactProductUsage.org_id.is_(None))
            )
        res = await session.execute(stmt)
        records = res.scalars().all()

        # Group in Python for 100% dialect compatibility across Postgres and SQLite
        account_map = {}
        for r in records:
            acc_id = r.account_id
            if acc_id not in account_map:
                account_map[acc_id] = {
                    "account_id": r.account_id,
                    "account_name": r.account_name,
                    "arr": float(r.arr),
                    "activity_7d": [],
                    "activity_28d": []
                }
            
            activity = r.active_users + r.api_calls + r.feature_execution_count
            m_date = r.metric_date if isinstance(r.metric_date, date) else date.fromisoformat(str(r.metric_date))

            if m_date >= twenty_eight_days_ago:
                account_map[acc_id]["activity_28d"].append(activity)
            if m_date >= seven_days_ago:
                account_map[acc_id]["activity_7d"].append(activity)

        flagged_accounts: list[AccountRiskState] = []

        for acc_id, data in account_map.items():
            act_7d = data["activity_7d"]
            act_28d = data["activity_28d"]

            avg_7d = sum(act_7d) / len(act_7d) if act_7d else 0.0
            avg_28d = sum(act_28d) / len(act_28d) if act_28d else 0.0

            if avg_28d > 0:
                drop_pct = ((avg_28d - avg_7d) / avg_28d) * 100.0
            else:
                drop_pct = 0.0

            # Flag accounts with > 20% usage drop
            if drop_pct >= 20.0:
                flagged_accounts.append({
                    "account_id": data["account_id"],
                    "account_name": data["account_name"],
                    "arr": data["arr"],
                    "usage_drop_pct": round(drop_pct, 2),
                    "avg_7d": round(avg_7d, 2),
                    "avg_28d": round(avg_28d, 2),
                    "tickets": [],
                    "root_cause": None,
                    "reasoning_summary": None,
                    "urgency_score": None,
                    "recommended_playbook": None,
                    "action_status": None
                })

        state["flagged_accounts"] = flagged_accounts
        state["status"] = "SCAN_COMPLETE"
        state["message"] = f"Detected {len(flagged_accounts)} account(s) with >20% usage drop."
        return state
