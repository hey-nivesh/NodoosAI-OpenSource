"use client";

const stats = [
  { v: "98%", l: "Retention Accuracy" },
  { v: "$1M+", l: "Revenue Retained" },
  { v: "10,000+", l: "Signals/sec" },
  { v: "99.9%", l: "Uptime Guarantee" },
];

export function Stats() {
  return (
    <section className="border-y border-border bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Delivering Growth For Modern Businesses
          </h2>
          <p className="mt-3 text-muted-foreground">
            Empowering customer success and product teams to operate at
            unmatched velocity.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <div
                className="bg-clip-text text-4xl font-semibold text-transparent md:text-5xl"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, oklch(0.18 0.04 265), oklch(0.58 0.19 262))",
                }}
              >
                {s.v}
              </div>
              <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
