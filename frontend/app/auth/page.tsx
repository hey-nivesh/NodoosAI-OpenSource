"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, User, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ?? null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/dashboard");
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username, // the mock client will take this username
        password,
      });

      if (error) throw error;
      
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left branding panel */}
      <div
        className="hidden w-1/2 flex-col justify-between p-12 lg:flex"
        style={{ background: "linear-gradient(135deg, oklch(0.22 0.04 265), oklch(0.18 0.04 265))" }}
      >
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/nodoos-logo.png" alt="Nodoos AI" width={36} height={36} className="object-contain" />
            <span className="text-xl font-black tracking-tight text-white">NODOOS AI</span>
          </Link>
        </div>

        <div className="space-y-6">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-white backdrop-blur"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Autonomous Churn Rescue Agent 3.0
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Protect your revenue with AI-powered telemetry monitoring.
          </h1>
          <p className="max-w-md text-sm leading-relaxed" style={{ color: "oklch(0.99 0 0 / 0.7)" }}>
            Scan 7-day vs 28-day usage drop anomalies, analyze support sentiment with Groq LLM, and trigger mitigation playbooks automatically — per workspace.
          </p>
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <div>
              <div className="text-2xl font-bold text-white">$1M+</div>
              <div className="text-xs" style={{ color: "oklch(0.99 0 0 / 0.6)" }}>Revenue Retained</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">98%</div>
              <div className="text-xs" style={{ color: "oklch(0.99 0 0 / 0.6)" }}>Retention Accuracy</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.99 0 0 / 0.5)" }}>
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Autonomous CSM Agent portal — authorized access only
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-surface">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/nodoos-logo.png" alt="Nodoos AI" width={32} height={32} />
              <span className="font-bold tracking-tight text-foreground">NODOOS AI</span>
            </Link>
          </div>

          {/* Error/Success alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMsg}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Admin Sign In
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your administrator credentials to access the telemetry dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In as Admin
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Authorized admin portal. All logins and operations are securely audited.
          </p>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            username - admin
          </p>
          <p>
            password - nodoos-ai-admin
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
