import { fetchActionsLog } from "@/lib/api";
import { ActionsLog } from "@/components/ActionsLog";
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function ActionsPage() {
  const actionsData = await fetchActionsLog();
  const actions = actionsData.actions || [];

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
          <History className="h-3.5 w-3.5" />
          Churn Rescue Audit Trail Log
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          All Triggered Playbooks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full audit history of all LangGraph agent execution runs, root cause classifications, and playbook dispatches.
        </p>
      </div>
      <ActionsLog actions={actions} />
    </div>
  );
}
