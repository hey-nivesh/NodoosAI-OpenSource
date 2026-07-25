"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  ShieldAlert, TrendingDown, ArrowUpDown, X, RefreshCw,
} from "lucide-react";
import { fetchAtRiskAccounts, fetchAccountDetail, triggerAgentRun, type AtRiskAccount } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const ROOT_CAUSES = [
  "UNRESOLVED_CRITICAL_BUG", "ONBOARDING_FRICTION", "PRICE_SENSITIVITY",
  "LOW_FEATURE_ADOPTION", "UNKNOWN",
];

const PLAYBOOK_COLORS: Record<string, string> = {
  EXECUTIVE_ESCALATION: "bg-rose-50 text-rose-700",
  DEDICATED_CSM_ASSIGNMENT: "bg-blue-50 text-blue-700",
  EXECUTIVE_DISCOUNT_REVIEW: "bg-orange-50 text-orange-700",
  HIGH_TOUCH_CSM_OUTREACH: "bg-purple-50 text-purple-700",
  AUTOMATED_NURTURE_SEQUENCE: "bg-emerald-50 text-emerald-700",
  EMERGENCY_INTERVENTION: "bg-red-100 text-red-800",
};

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-md bg-muted animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

function TriageDrawer({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    fetchAccountDetail(accountId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [accountId]);

  const handleRerun = async () => {
    setRerunning(true);
    try { await triggerAgentRun(); } catch {}
    setRerunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">{detail?.account_name ?? "Loading…"}</h2>
            <p className="text-xs text-muted-foreground">Account Triage</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : !detail ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            Failed to load account detail
          </div>
        ) : (
          <div className="flex-1 space-y-6 p-6">
            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "ARR", value: `$${(detail.arr / 1000).toFixed(0)}k` },
                { label: "Usage Drop", value: `-${detail.usage_drop_pct?.toFixed(1)}%`, danger: true },
                { label: "Playbook", value: detail.recommended_playbook?.replace(/_/g, " ") ?? "—", small: true },
              ].map(({ label, value, danger, small }) => (
                <div key={label} className="rounded-xl border border-border bg-background p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className={`mt-1 font-bold ${small ? "text-xs" : "text-lg"} ${danger ? "text-rose-600" : "text-foreground"}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Root cause */}
            {detail.root_cause && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Root Cause</h3>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {detail.root_cause.replace(/_/g, " ")}
                </span>
              </div>
            )}

            {/* Usage chart */}
            {detail.usage_history?.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Usage Trend (active users)
                </h3>
                <div className="rounded-xl border border-border bg-background p-3">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={detail.usage_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 258)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: "oklch(0.55 0.03 258)" }}
                        tickFormatter={(d) => d?.slice(5)}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 9, fill: "oklch(0.55 0.03 258)" }} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid oklch(0.92 0.01 258)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="active_users"
                        stroke="oklch(0.58 0.19 262)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Reasoning */}
            {detail.reasoning_summary && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  LLM Reasoning
                </h3>
                <p className="rounded-xl border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
                  {detail.reasoning_summary}
                </p>
              </div>
            )}

            {/* Support tickets */}
            {detail.support_tickets?.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Open Support Tickets ({detail.support_tickets.length})
                </h3>
                <div className="space-y-2">
                  {detail.support_tickets.map((t: any) => (
                    <div key={t.ticket_id} className="rounded-xl border border-border bg-background px-4 py-3">
                      <div className="text-xs font-semibold text-foreground">{t.subject}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {t.status} · {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Re-run button */}
            <button
              onClick={handleRerun}
              disabled={rerunning}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/5 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${rerunning ? "animate-spin" : ""}`} />
              {rerunning ? "Re-running analysis…" : "Re-run Analysis for This Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AtRiskAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [drawerAccountId, setDrawerAccountId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAtRiskAccounts({
        page, per_page: 20, search: search || undefined,
        root_cause: selectedCauses.join(",") || undefined,
        sort_by: sortBy, sort_dir: sortDir,
      });
      setAccounts(data);
    } catch {
      setError("Failed to load accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCauses, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
  };

  const toggleCause = (c: string) => {
    setSelectedCauses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
            <ShieldAlert className="h-3.5 w-3.5" /> At-Risk Accounts
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Churn Risk Radar</h1>
          <p className="text-sm text-muted-foreground mt-1">All accounts with detected usage anomalies</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search accounts…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-9 rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
        </div>

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Filter className="h-4 w-4" />
          Root Cause
          {selectedCauses.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "oklch(0.58 0.19 262)" }}>
              {selectedCauses.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {filterOpen && (
          <div className="absolute z-20 mt-1 rounded-2xl border border-border bg-surface p-3 shadow-xl" style={{ marginTop: "48px" }}>
            {ROOT_CAUSES.map(c => (
              <label key={c} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCauses.includes(c)}
                  onChange={() => toggleCause(c)}
                  className="accent-accent"
                />
                {c.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        )}

        {selectedCauses.length > 0 && (
          <button onClick={() => setSelectedCauses([])} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Error */}
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
                {[
                  { label: "Account", col: "account_name" },
                  { label: "ARR", col: "arr" },
                  { label: "Usage Drop", col: "usage_drop_pct" },
                  { label: "Root Cause", col: null },
                  { label: "Playbook", col: null },
                  { label: "Detected", col: "created_at" },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={col ? () => toggleSort(col) : undefined}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col ? "cursor-pointer hover:text-foreground" : ""}`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {col && sortBy === col && <ArrowUpDown className="h-3 w-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
                        <p className="text-sm font-semibold text-foreground">No at-risk accounts found</p>
                        <p className="mt-1 text-xs text-muted-foreground">Run the agent to scan for churn signals, or adjust your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : accounts.map((acc) => (
                  <tr
                    key={acc.action_id}
                    onClick={() => setDrawerAccountId(acc.account_id)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "oklch(0.58 0.19 262)" }}>
                          {acc.account_name?.[0] ?? "A"}
                        </div>
                        <span className="font-semibold text-foreground">{acc.account_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ${(acc.arr / 1000).toFixed(0)}k
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-semibold text-rose-600">
                        <TrendingDown className="h-3.5 w-3.5" />
                        -{acc.usage_drop_pct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {acc.root_cause && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          {acc.root_cause.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${PLAYBOOK_COLORS[acc.recommended_playbook] ?? "bg-muted text-muted-foreground"}`}>
                        {acc.recommended_playbook.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
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

      {/* Triage Drawer */}
      {drawerAccountId && (
        <TriageDrawer accountId={drawerAccountId} onClose={() => setDrawerAccountId(null)} />
      )}
    </div>
  );
}
