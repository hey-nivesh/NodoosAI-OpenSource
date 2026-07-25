from typing import TypedDict, Optional, List, Dict, Any

class AccountRiskState(TypedDict):
    account_id: str
    account_name: str
    arr: float
    usage_drop_pct: float
    avg_7d: float
    avg_28d: float
    tickets: List[Dict[str, str]]
    root_cause: Optional[str]
    reasoning_summary: Optional[str]
    urgency_score: Optional[int]
    recommended_playbook: Optional[str]
    action_status: Optional[str]

class WorkflowState(TypedDict):
    flagged_accounts: List[AccountRiskState]
    processed_actions: List[Dict[str, Any]]
    status: str
    message: str
    org_id: Optional[str]   # Multi-tenant: scopes all DB queries to the right org
