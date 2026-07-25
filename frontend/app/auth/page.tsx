"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const errorParam = searchParams.get("error");

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ?? null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);

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
      if (resetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
        });
        if (error) throw error;
        setSuccessMsg("Password reset email sent — check your inbox.");
        setResetMode(false);
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });
        if (error) throw error;
        
        if (data?.session) {
          router.push("/onboarding");
          router.refresh();
        } else {
          setSuccessMsg("Account created! Check your email to confirm, then you'll be redirected to onboarding.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSlackOAuth = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "slack",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (error) {
      setError(error.message);
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
          Supabase Auth + Row-Level Security — your data stays yours
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
              {resetMode ? "Reset your password" : mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {resetMode
                ? "Enter your email and we'll send a reset link"
                : mode === "login"
                ? "Enter your credentials to access the dashboard"
                : "Get started — your org workspace is created automatically"}
            </p>
          </div>

          {!resetMode && (
            <>
              {/* Mode toggle */}
              <div className="mt-6 grid grid-cols-2 rounded-xl border border-border bg-background p-1 text-xs font-semibold">
                <button
                  onClick={() => { setMode("login"); setError(null); }}
                  className={`rounded-lg py-2 transition-colors ${mode === "login" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode("signup"); setError(null); }}
                  className={`rounded-lg py-2 transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Sign Up
                </button>
              </div>

              {/* OAuth Providers */}
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  id="google-oauth-btn"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <Image src="/icon-google.png" alt="Google" width={16} height={16} />
                  Continue with Google
                </button>
                <button
                  onClick={handleSlackOAuth}
                  disabled={loading}
                  id="slack-oauth-btn"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <Image src="/icon-slack.png" alt="Slack" width={16} height={16} />
                  Continue with Slack
                </button>
              </div>

              <div className="relative my-6 text-center text-xs text-muted-foreground">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-surface px-3 uppercase tracking-wider">Or continue with email</span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && !resetMode && (
              <div>
                <label htmlFor="full-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Work Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {!resetMode && (
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => { setResetMode(true); setError(null); }}
                      className="text-xs text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
            )}

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {resetMode ? "Sending..." : mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <>
                  {resetMode ? "Send Reset Email" : mode === "login" ? "Sign In to Dashboard" : "Create Account & Continue"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {resetMode && (
              <button
                type="button"
                onClick={() => { setResetMode(false); setError(null); }}
                className="mt-1 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to sign in
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to Nodoos AI&apos;s{" "}
            <a href="#" className="text-accent hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
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
