import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { t: "Product", l: ["Features", "Integrations", "Pricing", "Changelog"] },
  { t: "Company", l: ["About Us", "Blog", "Careers", "Contact"] },
  { t: "Resources", l: ["Docs", "Guides", "API", "Community"] },
  { t: "Legal", l: ["Privacy", "Terms", "Security", "SOC2"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {/* CTA Banner */}
        <div
          className="rounded-3xl p-10 text-center text-primary-foreground shadow-xl md:p-16"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.04 265), oklch(0.22 0.04 265 / 0.9))",
          }}
        >
          <h3 className="text-3xl font-medium tracking-tight md:text-4xl">
            Ready to Automate Your Revenue Defense?
          </h3>
          <p className="mx-auto mt-3 max-w-xl" style={{ color: "oklch(0.99 0 0 / 0.7)" }}>
            Launch your first autonomous agent in minutes. No credit card required.
          </p>
          <Link
            href="/auth?mode=signup"
            className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-[1.03]"
          >
            Get Started Free
          </Link>
        </div>

        {/* Footer links */}
        <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <Image
                src="/nodoos-logo.png"
                alt="Nodoos AI"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-semibold tracking-tight text-foreground">
                NODOOS AI
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Crafting the future of intelligent workflows through AI automation.
            </p>
          </div>
          {footerLinks.map((c) => (
            <div key={c.t}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {c.t}
              </div>
              <ul className="mt-3 space-y-2">
                {c.l.map((it) => (
                  <li key={it}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {it}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Nodoos AI. All Rights Reserved.</div>
          <div>Built with intelligence.</div>
        </div>

        {/* Big wordmark */}
        <div
          aria-hidden
          className="pointer-events-none mt-8 whitespace-nowrap bg-clip-text text-center text-[14vw] font-bold leading-none tracking-tighter text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, oklch(0.18 0.04 265 / 0.1), transparent)",
          }}
        >
          NODOOS AI
        </div>
      </div>
    </footer>
  );
}
