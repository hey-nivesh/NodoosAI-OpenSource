"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Connect Data Stream",
    desc: "Link your Supabase telemetry, CRM, and billing systems via one-click secure OAuth.",
  },
  {
    n: "02",
    title: "Configure Agent Skills",
    desc: "Define LangGraph nodes and automated triggers for usage drops and sentiment shifts.",
  },
  {
    n: "03",
    title: "Autonomously Scale",
    desc: "Sit back as your AI agent triages signals, sends alerts, and restores account health.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          Easy Setup
        </span>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Start Smarter With Three Easy Steps
        </h2>
        <p className="mt-4 text-muted-foreground">
          Get your autonomous churn defense agent live in less than 15 minutes.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="relative rounded-3xl border border-border bg-surface p-8 shadow-sm"
          >
            <div className="text-5xl font-medium text-accent/30">{s.n}</div>
            <h3 className="mt-6 text-lg font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
