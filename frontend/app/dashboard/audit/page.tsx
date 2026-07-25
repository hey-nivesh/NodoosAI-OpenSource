"use client";

import { useState, useEffect, useCallback } from "react";
import { History, Download, Search, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { fetchActionsLog, type AuditAction } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PLAYBOOKS = [
  "EXECUTIVE_ESCALATION", "DEDICATED_CSM_ASSIGNMENT", "EXECUTIVE_DISCOUNT_REVIEW",
  "HIGH_TOUCH_CSM_OUTREACH", "AUTOMATED_NURTURE_SEQUENCE", "EMERGENCY_INTERVENTION",
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  TRIGGERED: { label: "EXECUTED", className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  SLACK_FAILED: { label: "SLACK FAILED", className: "bg-rose-50 text-rose-700", icon: AlertTriangle },
  PENDING: { label: "PENDING", className: "bg-amber-50 text-amber-700", icon: Clock },
};

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded-md bg-muted animate-pulse" style={{ width: `${50 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AuditPage() {
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [playbook, setPlaybook] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActionsLog({
        page, per_page: 20,
        search: search || undefined,
        playbook: playbook || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setActions(data.actions);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      setError("Failed to load audit trail. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [page, search, playbook, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (playbook) qs.set("playbook", playbook);
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);

      const res = await fetch(`${API_BASE}/api/actions/export?${qs}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "churn_rescue_audit.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
            <History className="h-3.5 w-3.5" /> Audit Trail
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Action History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} total rescue actions logged
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          id="export-csv-btn"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search accounts…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-9 rounded-xl border border-border bg-surface pl-9 pr-4 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <select
          value={playbook}
          onChange={e => { setPlaybook(e.target.value); setPage(1); }}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">All Playbooks</option>
          {PLAYBOOKS.map(p => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                {["Account", "ARR", "Drop", "Playbook", "Status", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                : actions.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center py-16 text-center">
                        <History className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
                        <p className="text-sm font-semibold text-foreground">No audit trail entries yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">Run the agent to start logging churn rescue actions.</p>
                      </div>
                    </td>
                  </tr>
                ) : actions.map((action) => {
                  const statusCfg = STATUS_CONFIG[action.action_status] ?? STATUS_CONFIG.TRIGGERED;
                  const StatusIcon = statusCfg.icon;
                  const expanded = expandedId === action.action_id;
                  return (
                    <>
                      <tr
                        key={action.action_id}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => setExpandedId(expanded ? null : action.action_id)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "oklch(0.58 0.19 262)" }}>
                              {action.account_name?.[0] ?? "A"}
                            </div>
                            <span className="font-semibold text-foreground">{action.account_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold">${(action.arr / 1000).toFixed(0)}k</td>
                        <td className="px-4 py-3.5 text-rose-600 font-semibold">-{action.usage_drop_pct?.toFixed(1)}%</td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            {action.recommended_playbook?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusCfg.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {action.created_at ? new Date(action.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${action.action_id}-expanded`}>
                          <td colSpan={7} className="bg-muted/30 px-6 py-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Root Cause</span>
                                <p className="mt-1 text-foreground">{action.root_cause?.replace(/_/g, " ") ?? "Unknown"}</p>
                              </div>
                              <div>
                                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Slack Notification</span>
                                <p className="mt-1 text-foreground">{action.slack_notification_sent ? "✓ Delivered" : "✗ Not sent"}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Reasoning</span>
                                <p className="mt-1 leading-relaxed text-foreground">{action.reasoning_summary ?? "No reasoning captured."}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
