"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Mail, Send, CheckCircle2 } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How does anomaly detection work?",
    a: "Our agent monitors product usage metrics (like active users, API calls, and feature execution counts) daily. It compares the 7-day moving average against the 28-day moving average. If the drop exceeds standard variance thresholds, the account is automatically flagged for triage.",
  },
  {
    q: "What is a playbook?",
    a: "Playbooks are sets of actions triggered automatically to mitigate churn. Depending on the root cause and the account's ARR tier, the agent determines the optimal playbook (e.g., Executive Escalation, dedicated outreach, or automated email nurture campaigns) and notifies the team.",
  },
  {
    q: "How do I connect Slack?",
    a: "An administrator can connect Slack from Onboarding or Settings → Integrations. Click 'Connect Slack Workspace', select the channel where alert messages should go, and authorize the integration. Alerts will start routing immediately.",
  },
  {
    q: "How do I invite teammates?",
    a: "If you have the Admin role, navigate to Settings → Team, enter your teammate's email address, and click invite. They will receive an email containing a link to join your organization as a CSM.",
  },
];

export default function HelpPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${API_BASE}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      setSuccess("Your message has been sent successfully. We'll get back to you shortly!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to submit form. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
          <HelpCircle className="h-3.5 w-3.5" />
          Help & Support
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Help Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse FAQs or get in touch with our engineering and support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-surface overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-foreground text-sm hover:bg-muted/30 transition-colors"
                  >
                    {item.q}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border bg-background/50">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm h-fit space-y-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Contact Support</h2>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Can't find what you need? Send our support team a message directly. We typically reply within 24 hours.
          </p>

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="support-name" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your Name
              </label>
              <input
                id="support-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Alex Smith"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="support-email" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <input
                id="support-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="support-message" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Message
              </label>
              <textarea
                id="support-message"
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue or request…"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              id="support-submit-btn"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              {sending ? "Sending message…" : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
