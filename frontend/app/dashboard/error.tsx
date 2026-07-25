"use client";

import { useEffect } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard boundary error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 border border-rose-200">
        <ShieldAlert className="h-6 w-6 text-rose-600" />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground">Something went wrong</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
          An unexpected error occurred while loading this dashboard screen. Please try reloading the page.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry Loading
      </button>
    </div>
  );
}
