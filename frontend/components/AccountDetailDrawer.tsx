"use client";

import { AtRiskAccount } from "@/lib/api";
import { X, AlertTriangle, ShieldCheck, FileText, ArrowRight } from "lucide-react";

export function AccountDetailDrawer({
  account,
  onClose,
}: {
  account: AtRiskAccount | null;
  onClose: () => void;
}) {
  if (!account) return null;

  const getPlaybookBadgeClass = (playbook: string) => {
    switch (playbook) {
      case "EMERGENCY_INTERVENTION":
      case "EXECUTIVE_ESCALATION":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "DEDICATED_CSM_ASSIGNMENT":
      case "EXECUTIVE_DISCOUNT_REVIEW":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl border-l border-border animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <span className="text-xs font-mono uppercase text-muted-foreground">Account Triage</span>
            <h2 className="text-xl font-bold text-foreground">{account.account_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-background p-4">
            <div>
              <div className="text-xs text-muted-foreground">Annual Recurring Revenue</div>
              <div className="mt-1 text-xl font-bold text-foreground">
                ${account.arr.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">7d vs 28d Usage Drop</div>
              <div className="mt-1 text-xl font-bold text-rose-600">
                -{account.usage_drop_pct}%
              </div>
            </div>
          </div>

          {/* Root Cause Classification */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Classified Root Cause (LLM)
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {account.root_cause || "UNKNOWN"}
            </div>
          </div>

          {/* Recommended Playbook */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Assigned Playbook (Rules Matrix)
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-bold ${getPlaybookBadgeClass(
                account.recommended_playbook
              )}`}
            >
              <ShieldCheck className="h-4 w-4" />
              {account.recommended_playbook}
            </div>
          </div>

          {/* Agent Reasoning Summary */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <FileText className="h-4 w-4 text-accent" />
              Agent Reasoning Summary
            </div>
            <div className="rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground">
              {account.reasoning_summary || "No reasoning summary generated."}
            </div>
          </div>

          {/* Audit Timestamp */}
          <div className="border-t border-border pt-4 text-xs text-muted-foreground">
            Action triggered at: {account.created_at ? new Date(account.created_at).toLocaleString() : "Just now"}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-background">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Close Detail View
          </button>
        </div>
      </div>
    </div>
  );
}
