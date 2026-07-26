"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAtRiskAccounts, fetchActionsLog } from "@/lib/api";
import { AccountsTable } from "@/components/AccountsTable";
import { RunAgentButton } from "@/components/RunAgentButton";
import {
  ShieldAlert,
  DollarSign,
  Activity,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
} from "lucide-react";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  trendUp,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: any;
  trend?: string;
  trendUp?: boolean;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div
          className="grid h-8 w-8 place-items-center rounded-xl"
          style={{ background: `${color}18` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{sub}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              trendUp
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {trendUp ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function RecentActionsPanel({ actions }: { actions: any[] }) {
  const recent = actions.slice(0, 6);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Today</span>
      </div>
      <div className="space-y-3">
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">No actions logged yet. Run the agent to generate actions.</p>
        ) : (
          recent.map((act, i) => (
            <div key={act.action_id || i} className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "oklch(0.58 0.19 262)" }}
              >
                {act.account_name?.[0] ?? "A"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-foreground">
                  {act.account_name}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {act.recommended_playbook?.replace(/_/g, " ")}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {act.created_at
                    ? new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Just now"}
                </div>
              </div>
              <span
                className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                  act.action_status === "TRIGGERED"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {act.action_status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AgentHealthCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Agent Health</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      </div>
      <div className="space-y-3">
        {[
          { label: "Usage Drop Detector", pct: 100, color: "oklch(0.7 0.19 160)" },
          { label: "Sentiment Analyzer", pct: 100, color: "oklch(0.58 0.19 262)" },
          { label: "Playbook Trigger", pct: 100, color: "oklch(0.65 0.22 40)" },
        ].map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${item.pct}%`, background: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border pt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">LLM Provider</div>
          <div className="font-semibold text-foreground mt-0.5">Groq · Llama 3.3</div>
        </div>
        <div>
          <div className="text-muted-foreground">Database</div>
          <div className="font-semibold text-foreground mt-0.5">Supabase PG</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accs, actionsData] = await Promise.all([
        fetchAtRiskAccounts(),
        fetchActionsLog(),
      ]);
      setAccounts(accs);
      setActions(actionsData.actions || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalArr = accounts.reduce((s, a) => s + a.arr, 0);
  const avgDrop = accounts.length
    ? accounts.reduce((s, a) => s + a.usage_drop_pct, 0) / accounts.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Autonomous Churn Rescue · Live
          </div>
          <p className="text-sm text-muted-foreground">
            7-day vs 28-day moving average scanning · Groq LLM Sentiment · Rules Matrix Playbooks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <RunAgentButton onComplete={loadData} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title="At-Risk Accounts"
          value={loading ? "—" : String(accounts.length)}
          sub="Detected churn signals"
          icon={ShieldAlert}
          trend="+2 this week"
          trendUp={false}
          color="oklch(0.65 0.22 25)"
        />
        <StatCard
          title="ARR at Risk"
          value={loading ? "—" : `$${(totalArr / 1000).toFixed(0)}k`}
          sub="Annual revenue exposed"
          icon={DollarSign}
          trend={accounts.length > 0 ? "High exposure" : "Stable"}
          trendUp={false}
          color="oklch(0.58 0.19 262)"
        />
        <StatCard
          title="Avg Usage Drop"
          value={loading ? "—" : `-${avgDrop.toFixed(1)}%`}
          sub="vs 28-day average"
          icon={Activity}
          trend="7-day window"
          trendUp={false}
          color="oklch(0.65 0.22 40)"
        />
        <StatCard
          title="Playbooks Triggered"
          value={loading ? "—" : String(actions.length)}
          sub="Total rescue actions"
          icon={CheckCircle2}
          trend="All time"
          trendUp={true}
          color="oklch(0.7 0.19 160)"
        />
      </div>

      {/* Skeleton overlay during first load */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 h-64 rounded-2xl border border-border bg-surface animate-pulse" />
          <div className="space-y-5">
            <div className="h-48 rounded-2xl border border-border bg-surface animate-pulse" />
            <div className="h-48 rounded-2xl border border-border bg-surface animate-pulse" />
          </div>
        </div>
      ) : (
        /* Main Content Grid */
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left — Accounts Table (2/3 width) */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Flagged Churn Risk Accounts ({accounts.length})
              </h2>
            </div>
            <AccountsTable accounts={accounts} />
          </div>

          {/* Right — Panels (1/3 width) */}
          <div className="space-y-5">
            <AgentHealthCard />
            <RecentActionsPanel actions={actions} />
          </div>
        </div>
      )}
    </div>
  );
}
