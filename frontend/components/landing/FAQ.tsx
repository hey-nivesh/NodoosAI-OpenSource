"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const qs = [
  {
    q: "How does the autonomous agent ingest data?",
    a: "Nodoos AI connects via Supabase Postgres using SQLAlchemy, with real-time vector embeddings stored in pgvector — ensuring your enterprise telemetry stays in your own cloud.",
  },
  {
    q: "Can I integrate existing CRM tools?",
    a: "Yes, we support native two-way sync with Salesforce, HubSpot, Zendesk, and custom HTTP webhooks via the FastAPI integration layer.",
  },
  {
    q: "Is there a free trial available?",
    a: "We offer a 14-day full feature trial with full access to our LangGraph agent suite and pre-built playbooks.",
  },
  {
    q: "Do I need deep technical knowledge to deploy?",
    a: "No. While developers love our CLI, RevOps and CS teams can build complex workflows using our drag-and-drop visual flow builder.",
  },
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes, you can manage your subscription instantly from your dashboard settings.",
  },
  {
    q: "Is my enterprise data completely secure?",
    a: "We are SOC2 Type II certified, GDPR compliant, and utilize end-to-end AES-256 encryption for all data in transit and at rest.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-20 md:px-6 md:py-28">
      <div className="text-center">
        <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          FAQ
        </span>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Common Questions, Clear Answers
        </h2>
        <p className="mt-4 text-muted-foreground">
          Everything you need to know about integrating Nodoos AI into your
          infrastructure.
        </p>
      </div>
      <div className="mt-12 space-y-3">
        {qs.map((item, i) => (
          <div
            key={item.q}
            className="rounded-2xl border border-border bg-surface transition-colors"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-sm font-medium text-foreground md:text-base">
                {item.q}
              </span>
              {open === i ? (
                <Minus className="h-4 w-4 shrink-0 text-accent" />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {open === i && (
              <div className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
