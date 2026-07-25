"use client";

import { useState } from "react";
import { AtRiskAccount } from "@/lib/api";
import { AccountDetailDrawer } from "@/components/AccountDetailDrawer";
import { ArrowUpRight, AlertCircle, ShieldAlert } from "lucide-react";

export function AccountsTable({ accounts }: { accounts: AtRiskAccount[] }) {
  const [selectedAccount, setSelectedAccount] = useState<AtRiskAccount | null>(null);

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface p-12 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
        <h3 className="mt-4 text-base font-semibold text-foreground">No At-Risk Accounts Detected</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          All accounts are currently operating within expected usage bounds (&lt;20% drop).
        </p>
      </div>
    );
  }

  const getBadgeStyle = (playbook: string) => {
    switch (playbook) {
      case "EMERGENCY_INTERVENTION":
      case "EXECUTIVE_ESCALATION":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "DEDICATED_CSM_ASSIGNMENT":
      case "EXECUTIVE_DISCOUNT_REVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Account Name</th>
                <th className="px-6 py-4">ARR</th>
                <th className="px-6 py-4">Usage Drop</th>
                <th className="px-6 py-4">Root Cause</th>
                <th className="px-6 py-4">Assigned Playbook</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((acc) => (
                <tr
                  key={acc.action_id || acc.account_id}
                  className="transition-colors hover:bg-background/80"
                >
                  <td className="px-6 py-4 font-semibold text-foreground">
                    <div>{acc.account_name}</div>
                    <div className="text-[11px] font-mono font-normal text-muted-foreground">
                      {acc.account_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    ${acc.arr.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 border border-rose-200">
                      -{acc.usage_drop_pct}%
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-foreground">
                    {acc.root_cause ? (
                      <span className="rounded bg-muted px-2 py-1 font-semibold text-foreground">
                        {acc.root_cause}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeStyle(
                        acc.recommended_playbook
                      )}`}
                    >
                      {acc.recommended_playbook}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedAccount(acc)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                    >
                      View Triage <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AccountDetailDrawer
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />
    </>
  );
}
