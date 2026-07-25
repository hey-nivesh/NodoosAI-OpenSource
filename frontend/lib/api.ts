const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────

export interface AtRiskAccount {
  action_id: string;
  account_id: string;
  account_name: string;
  arr: number;
  usage_drop_pct: number;
  root_cause: string | null;
  reasoning_summary: string | null;
  recommended_playbook: string;
  action_status: string;
  slack_notification_sent?: boolean;
  created_at: string | null;
}

export interface AuditAction extends AtRiskAccount {}

export interface RunAgentResponse {
  success: boolean;
  status: string;
  message: string;
  flagged_count: number;
  actions_triggered: number;
  flagged_accounts: any[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string | null;
}

export interface SlackIntegration {
  connected: boolean;
  team_name?: string;
  team_id?: string;
  default_channel?: string;
  connected_at?: string;
}

export interface PlaybookRule {
  id?: string;
  root_cause: string;
  arr_tier_label: string;
  arr_threshold_min: number;
  arr_threshold_max: number | null;
  playbook_name: string;
  description?: string;
  is_active?: boolean;
  updated_at?: string;
}

// ── Auth helper ────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
    }
  } catch {}
  return { "Content-Type": "application/json" };
}

// ── Accounts ────────────────────────────────────────────────────

export async function fetchAtRiskAccounts(params?: {
  page?: number; per_page?: number; search?: string; root_cause?: string;
  min_arr?: number; max_arr?: number; sort_by?: string; sort_dir?: string;
}): Promise<AtRiskAccount[]> {
  try {
    const headers = await getAuthHeaders();
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    if (params?.search) qs.set("search", params.search);
    if (params?.root_cause) qs.set("root_cause", params.root_cause);
    if (params?.min_arr) qs.set("min_arr", String(params.min_arr));
    if (params?.max_arr) qs.set("max_arr", String(params.max_arr));
    if (params?.sort_by) qs.set("sort_by", params.sort_by);
    if (params?.sort_dir) qs.set("sort_dir", params.sort_dir);

    const res = await fetch(`${API_BASE}/api/accounts/at-risk?${qs}`, { cache: "no-store", headers });
    if (!res.ok) throw new Error("Failed to fetch at-risk accounts");
    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchAccountDetail(accountId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/accounts/${accountId}`, { cache: "no-store", headers });
  if (!res.ok) throw new Error("Failed to fetch account detail");
  return res.json();
}

// ── Actions ─────────────────────────────────────────────────────

export async function fetchActionsLog(params?: {
  page?: number; per_page?: number; search?: string;
  playbook?: string; date_from?: string; date_to?: string;
}): Promise<{ actions: AuditAction[]; total: number; total_pages: number }> {
  try {
    const headers = await getAuthHeaders();
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    if (params?.search) qs.set("search", params.search);
    if (params?.playbook) qs.set("playbook", params.playbook);
    if (params?.date_from) qs.set("date_from", params.date_from);
    if (params?.date_to) qs.set("date_to", params.date_to);

    const res = await fetch(`${API_BASE}/api/actions?${qs}`, { cache: "no-store", headers });
    if (!res.ok) throw new Error("Failed to fetch actions log");
    const data = await res.json();
    return { actions: data.actions || [], total: data.total || 0, total_pages: data.total_pages || 1 };
  } catch (err) {
    console.error(err);
    return { actions: [], total: 0, total_pages: 1 };
  }
}

// ── Agent ────────────────────────────────────────────────────────

export async function triggerAgentRun(): Promise<RunAgentResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/agent/run`, { method: "POST", headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Execution failed" }));
    throw new Error(err.detail || "Agent execution failed");
  }
  return res.json();
}

// ── Slack ─────────────────────────────────────────────────────────

export async function fetchSlackIntegration(): Promise<SlackIntegration> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/slack/integration`, { cache: "no-store", headers });
    if (!res.ok) return { connected: false };
    return res.json();
  } catch {
    return { connected: false };
  }
}

export async function disconnectSlack(): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${API_BASE}/api/slack/integration`, { method: "DELETE", headers });
}

// ── Notifications ─────────────────────────────────────────────────

export async function fetchNotifications(params?: { page?: number; unread_only?: boolean }) {
  try {
    const headers = await getAuthHeaders();
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.unread_only) qs.set("unread_only", "true");
    const res = await fetch(`${API_BASE}/api/notifications?${qs}`, { cache: "no-store", headers });
    if (!res.ok) return { notifications: [], unread_count: 0 };
    return res.json();
  } catch {
    return { notifications: [], unread_count: 0 };
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: "POST", headers });
}

export async function markAllNotificationsRead(): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${API_BASE}/api/notifications/read-all`, { method: "POST", headers });
}

// ── Playbooks ─────────────────────────────────────────────────────

export async function fetchPlaybooks(): Promise<{ playbooks: PlaybookRule[]; source: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/playbooks`, { cache: "no-store", headers });
    if (!res.ok) return { playbooks: [], source: "default" };
    return res.json();
  } catch {
    return { playbooks: [], source: "default" };
  }
}

// ── Signals ───────────────────────────────────────────────────────

export async function fetchLiveSignals() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/signals/live`, { cache: "no-store", headers });
    if (!res.ok) return { signals: [], fetched_at: null };
    return res.json();
  } catch {
    return { signals: [], fetched_at: null };
  }
}

// ── Org ───────────────────────────────────────────────────────────

export async function fetchOrgMembers() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/org/members`, { cache: "no-store", headers });
    if (!res.ok) return { members: [] };
    return res.json();
  } catch {
    return { members: [] };
  }
}

export async function fetchOrg() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/org`, { cache: "no-store", headers });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
