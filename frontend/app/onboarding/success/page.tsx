"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function OnboardingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/dashboard"), 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, oklch(0.22 0.04 265), oklch(0.18 0.04 265))" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-10 text-center"
        style={{ background: "oklch(0.99 0 0)", boxShadow: "0 24px 80px oklch(0 0 0 / 0.4)" }}
      >
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "oklch(0.7 0.19 160 / 0.12)" }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: "oklch(0.65 0.22 160)" }} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">Slack connected!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your workspace is now wired up. Churn alerts will flow directly to your Slack channel.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Redirecting to dashboard…
        </div>
      </div>
    </div>
  );
}
