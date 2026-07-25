"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, TrendingDown, ArrowRight, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { fetchLiveSignals } from "@/lib/api";
import Link from "next/link";

const POLL_INTERVAL = 30_000; // 30 seconds

function SignalItem({ signal, isNew }: { signal: any; isNew: boolean }) {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border p-4 transition-all duration-700 ${
        isNew ? "border-accent/40 bg-accent/5 animate-pulse-once" : "border-border bg-surface"
      }`}
    >
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: isNew ? "oklch(0.58 0.19 262)" : "oklch(0.75 0.05 262)" }}
      >
        {signal.account_name?.[0] ?? "A"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">{signal.account_name}</span>
          {isNew && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              NEW
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-rose-600">
            <TrendingDown className="h-3.5 w-3.5" />
            -{signal.usage_drop_pct?.toFixed(1)}% usage
          </span>
          {signal.root_cause && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
              {signal.root_cause.replace(/_/g, " ")}
            </span>
          )}
          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
            {signal.recommended_playbook?.replace(/_/g, " ")}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {signal.created_at ? new Date(signal.created_at).toLocaleString() : "Just now"}
        </div>
      </div>

      <Link
        href={`/dashboard/accounts`}
        className="mt-1 shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(true);
  const prevIds = useRef<Set<string>>(new Set());

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveSignals();
      const incoming = data.signals ?? [];
      const incomingIds = new Set<string>(incoming.map((s: any) => s.id));

      // Find genuinely new signals
      const freshIds = new Set<string>();
      incomingIds.forEach((id: string) => {
        if (!prevIds.current.has(id)) freshIds.add(id);
      });

      if (freshIds.size > 0) {
        setNewSignalIds(freshIds);
        setTimeout(() => setNewSignalIds(new Set()), 10_000);
      }

      prevIds.current = incomingIds;
      setSignals(incoming);
      setLastFetch(new Date());
    } catch {
      setError("Failed to fetch live signals. Will retry automatically.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (isLive) load(true);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
            <Activity className="h-3.5 w-3.5" /> Live Signals
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Anomaly Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time churn signal detections · updates every 30 seconds
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              isLive ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            {isLive ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isLive ? "LIVE" : "Paused"}
            {isLive && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>

          <button
            onClick={() => load()}
            disabled={loading}
            className="rounded-xl border border-border bg-surface p-2 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Last updated */}
      {lastFetch && (
        <p className="text-xs text-muted-foreground">
          Last updated: {lastFetch.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => load()} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Signal list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-border bg-surface animate-pulse" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
          <p className="text-sm font-semibold text-foreground">No signals detected yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Run the agent to start detecting churn anomalies. New detections will appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map(signal => (
            <SignalItem
              key={signal.id}
              signal={signal}
              isNew={newSignalIds.has(signal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
