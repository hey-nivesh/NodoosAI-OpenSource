"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Zap, ArrowRight, MessageSquare, CheckCircle2, Bell, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function OnboardingPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectSlack = async () => {
    setConnecting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
        return;
      }

      const res = await fetch(`${API_BASE}/api/slack/authorize-url`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to get Slack authorization URL");

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message ?? "Failed to initiate Slack connection");
      setConnecting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, oklch(0.22 0.04 265), oklch(0.18 0.04 265))" }}
    >
      {/* Logo */}
      <div className="mb-12 flex items-center gap-2.5">
        <Image src="/nodoos-logo.png" alt="Nodoos AI" width={40} height={40} className="object-contain" />
        <span className="text-xl font-black tracking-tight text-white">NODOOS AI</span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{ background: "oklch(0.99 0 0)", boxShadow: "0 24px 80px oklch(0 0 0 / 0.4)" }}
      >
        {/* Icon */}
        <div
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "oklch(0.58 0.19 262 / 0.12)" }}
        >
          <MessageSquare className="h-7 w-7" style={{ color: "oklch(0.58 0.19 262)" }} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Connect Slack to get instant churn alerts
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          When our agent detects a churn signal, it fires a notification straight to your Slack workspace — in real time, while you still have time to act.
        </p>

        {/* Benefits */}
        <div className="mt-6 space-y-3">
          {[
            { icon: Bell, text: "Real-time alerts when accounts show churn signals" },
            { icon: Zap, text: "Playbook triggers delivered instantly to your team's channel" },
            { icon: ShieldCheck, text: "Your Slack workspace is isolated — no shared channels" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ background: "oklch(0.7 0.19 160 / 0.12)" }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: "oklch(0.65 0.22 160)" }} />
              </div>
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-8 space-y-3">
          <button
            id="connect-slack-btn"
            onClick={handleConnectSlack}
            disabled={connecting}
            className="flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{ background: "oklch(0.58 0.19 262)" }}
          >
            {connecting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Redirecting to Slack…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
                Connect Slack Workspace
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <Link
            href="/dashboard"
            id="skip-slack-btn"
            className="block w-full text-center py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now — I'll connect later in Settings
          </Link>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          You can always connect or disconnect Slack from{" "}
          <span className="font-semibold">Settings → Integrations</span>
        </p>
      </div>

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-2">
        <div className="h-2 w-8 rounded-full bg-white/20" />
        <div className="h-2 w-8 rounded-full bg-white" />
      </div>
      <p className="mt-2 text-xs text-white/50">Step 2 of 2 — Connect Slack</p>
    </div>
  );
}
