import { AtRiskAccount } from "@/lib/api";
import { AlertTriangle, DollarSign, Activity, CheckCircle2 } from "lucide-react";

export function StatsBar({ accounts }: { accounts: AtRiskAccount[] }) {
  const totalAtRisk = accounts.length;
  const totalArrRisk = accounts.reduce((acc, a) => acc + (a.arr || 0), 0);
  const avgDrop = totalAtRisk > 0 ? accounts.reduce((acc, a) => acc + (a.usage_drop_pct || 0), 0) / totalAtRisk : 0;
  const triggeredToday = accounts.filter(a => a.action_status === "TRIGGERED").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            At-Risk Accounts
          </span>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          {totalAtRisk}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Accounts with &gt;20% usage drop
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total ARR At Risk
          </span>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          ${totalArrRisk.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Combined annual recurring revenue
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Avg 7d Usage Drop
          </span>
          <Activity className="h-4 w-4 text-rose-500" />
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          -{avgDrop.toFixed(1)}%
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Compared to 28-day moving average
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Playbooks Triggered
          </span>
          <CheckCircle2 className="h-4 w-4 text-accent" />
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          {triggeredToday}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Active automated rescue workflows
        </div>
      </div>
    </div>
  );
}
