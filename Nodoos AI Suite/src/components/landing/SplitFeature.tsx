import { motion } from "framer-motion";
import { Check, TrendingUp } from "lucide-react";

export function SplitFeature() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          AI Insights
        </span>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Built To Simplify Every Workflow
        </h2>
        <p className="mt-4 text-muted-foreground">
          Transform complex data streams into actionable revenue recovery routines.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-border bg-surface p-10 shadow-sm"
        >
          <h3 className="text-2xl font-semibold text-foreground">Predictive Intelligence Engine</h3>
          <p className="mt-3 text-muted-foreground">
            Continuously scans user behavior, telemetry logs, and support interactions to flag
            retention risks before they turn into cancellation tickets.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Zero-latency signal ingestion",
              "Automated playbook dispatch",
              "Self-correcting confidence scores",
            ].map((l) => (
              <li key={l} className="flex items-center gap-3 text-sm text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-light">
                  <Check className="h-3 w-3 text-accent" />
                </span>
                {l}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground shadow-xl"
        >
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
              <TrendingUp className="h-3 w-3" />
              + $250,000 NRR Recovered
            </div>
            <div className="mt-8 h-48">
              <svg viewBox="0 0 400 180" className="h-full w-full">
                <defs>
                  <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.19 262)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="oklch(0.7 0.19 262)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,140 C60,130 100,110 150,95 C200,80 250,60 300,45 C340,35 380,25 400,20 L400,180 L0,180 Z"
                  fill="url(#area)"
                />
                <path
                  d="M0,140 C60,130 100,110 150,95 C200,80 250,60 300,45 C340,35 380,25 400,20"
                  stroke="oklch(0.85 0.15 262)"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle cx="300" cy="45" r="5" fill="oklch(0.95 0.05 262)" />
                <circle cx="300" cy="45" r="10" fill="oklch(0.85 0.15 262)" opacity="0.3" />
              </svg>
            </div>
            <div className="mt-4 text-3xl font-semibold">$1,209,987</div>
            <div className="text-sm text-primary-foreground/70">Total revenue restored this quarter</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
