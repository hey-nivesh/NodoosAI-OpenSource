"use client";

import { useState } from "react";
import { triggerAgentRun } from "@/lib/api";
import { Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function RunAgentButton({ onComplete }: { onComplete?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setStatusMsg(null);
    setIsError(false);

    try {
      const res = await triggerAgentRun();
      setStatusMsg(`Agent run complete! Flagged ${res.flagged_count} accounts, triggered ${res.actions_triggered} playbooks.`);
      if (onComplete) onComplete();
    } catch (err: any) {
      setIsError(true);
      setStatusMsg(err.message || "Failed to run agent.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(null), 6000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            isError
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {isError ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
          {statusMsg}
        </div>
      )}
      <button
        onClick={handleRun}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Executing LangGraph Agent...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-primary-foreground" />
            Re-run Autonomous Analysis
          </>
        )}
      </button>
    </div>
  );
}
