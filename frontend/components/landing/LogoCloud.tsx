"use client";

import { motion } from "framer-motion";

const logos = ["Lumen", "Northwind", "Atlas Co.", "Vertex", "Helix", "Synapse"];

export function LogoCloud() {
  return (
    <section
      id="integrations"
      className="border-y border-border bg-surface/60 py-10"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted By Worldwide Companies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {logos.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="text-base font-semibold text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              {name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
