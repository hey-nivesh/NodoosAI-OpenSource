import { AtRiskAccount } from "@/lib/api";
import { Clock, ShieldCheck, ExternalLink } from "lucide-react";

export function ActionsLog({ actions }: { actions: AtRiskAccount[] }) {
  if (actions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
        No rescue actions logged yet. Run the agent workflow to generate actions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((act, i) => (
        <div
          key={act.action_id || i}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-accent/40"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-light text-accent font-bold">
                #{i + 1}
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">{act.account_name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {act.created_at ? new Date(act.created_at).toLocaleString() : "Recently"}
                  <span>•</span>
                  <span>ARR: ${act.arr.toLocaleString("en-US")}</span>
                  <span>•</span>
                  <span className="text-rose-600 font-semibold">Drop: -{act.usage_drop_pct}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                {act.action_status}
              </span>
              <span className="rounded-full bg-primary text-primary-foreground px-3.5 py-1 text-xs font-bold">
                {act.recommended_playbook}
              </span>
            </div>
          </div>

          {act.reasoning_summary && (
            <div className="mt-4 rounded-xl border border-border bg-background p-3.5 text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Agent Analysis: </strong>
              {act.reasoning_summary}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
