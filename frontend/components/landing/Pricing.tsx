"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: 19,
    badge: "Individual",
    cta: "Get Started",
    featured: false,
    features: [
      "Up to 5 AI Agents",
      "Basic Telemetry Ingest",
      "Standard Support",
      "Weekly Reports",
    ],
  },
  {
    name: "Professional",
    price: 49,
    badge: "Most Popular",
    cta: "Start Free Trial",
    featured: true,
    features: [
      "Unlimited AI Agents",
      "Real-time Supabase Ingest",
      "LangGraph Direct Integration",
      "Priority 24/7 Support",
      "Custom Playbook Builder",
    ],
  },
  {
    name: "Enterprise",
    price: null,
    badge: "Enterprise",
    cta: "Contact Sales",
    featured: false,
    features: [
      "Dedicated Cluster",
      "Custom LLM Fine-tuning",
      "SLA & SOC2 Compliance",
      "Dedicated Account Mgr",
    ],
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          Pricing
        </span>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Simple Pricing For Every Stage Of Growth
        </h2>
        <p className="mt-4 text-muted-foreground">
          Flexible plans designed to scale with your data volume and operational
          velocity.
        </p>
        <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              !yearly
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              yearly
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Yearly{" "}
            <span className="ml-1 text-[10px] text-accent">-20%</span>
          </button>
        </div>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className={`relative flex flex-col rounded-3xl border p-8 shadow-sm ${
              p.featured
                ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                : "border-border bg-surface"
            }`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                {p.badge}
              </span>
            )}
            {!p.featured && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {p.badge}
              </span>
            )}
            <div
              className={`mt-2 text-lg font-semibold ${
                p.featured ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {p.name}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              {p.price !== null ? (
                <>
                  <span className="text-4xl font-semibold">
                    ${yearly ? Math.round(p.price * 12 * 0.8) : p.price}
                  </span>
                  <span
                    className={
                      p.featured ? "text-primary-foreground/70" : "text-muted-foreground"
                    }
                  >
                    /{yearly ? "yr" : "mo"}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-semibold">Custom</span>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span
                    className={
                      p.featured ? "text-primary-foreground/90" : "text-foreground"
                    }
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/auth?mode=signup"
              className={`mt-8 inline-block text-center rounded-full px-6 py-3 text-sm font-medium transition-transform hover:scale-[1.02] ${
                p.featured
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-surface text-foreground hover:bg-accent-light"
              }`}
            >
              {p.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
