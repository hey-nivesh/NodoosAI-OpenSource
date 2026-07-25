import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    quote:
      "The CLI integration was seamless. Our RevOps team recovered over $80k in expansion ARR within the first month.",
    author: "Marcus Vance",
    role: "VP Revenue Operations",
  },
  {
    quote:
      "Nodoos AI completely automated our account health scoring. The Cortex AI integration is unmatched.",
    author: "Elena Rostova",
    role: "Lead Architect",
  },
  {
    quote: "It transformed how we handle customer churn signals across our entire enterprise portfolio.",
    author: "Sarah Jenkins",
    role: "Head of Customer Success",
  },
  {
    quote: "The predictive intelligence accuracy is insane. Setup took under 10 minutes.",
    author: "Jason Lee",
    role: "Staff Engineer",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          Testimonials
        </span>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          Trusted By Businesses Around The World
        </h2>
        <p className="mt-4 text-muted-foreground">
          See how engineering leaders and revenue teams rely on Nodoos AI every day.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {reviews.map((r, i) => (
          <motion.div
            key={r.author}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-sm"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">"{r.quote}"</p>
            <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-sm font-semibold text-white">
                {r.author[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{r.author}</div>
                <div className="text-xs text-muted-foreground">{r.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
