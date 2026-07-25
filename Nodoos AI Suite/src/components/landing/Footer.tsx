import logo from "@/assets/nodoos-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/90 p-10 text-center text-primary-foreground shadow-xl md:p-16">
          <h3 className="text-3xl font-medium tracking-tight md:text-4xl">
            Ready to Automate Your Revenue Defense?
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/70">
            Launch your first autonomous agent in minutes. No credit card required.
          </p>
          <button className="mt-8 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-[1.03]">
            Get Started Free
          </button>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nodoos AI" className="h-8 w-8 object-contain" />
              <span className="font-semibold tracking-tight text-foreground">NODOOS AI</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Crafting the future of intelligent workflows through AI automation.
            </p>
          </div>
          {[
            { t: "Product", l: ["Features", "Integrations", "Pricing", "Changelog"] },
            { t: "Company", l: ["About Us", "Blog", "Careers", "Contact"] },
            { t: "Resources", l: ["Docs", "Guides", "API", "Community"] },
            { t: "Legal", l: ["Privacy", "Terms", "Security", "SOC2"] },
          ].map((c) => (
            <div key={c.t}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">{c.t}</div>
              <ul className="mt-3 space-y-2">
                {c.l.map((it) => (
                  <li key={it}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      {it}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Nodoos AI. All Rights Reserved.</div>
          <div>Built with intelligence.</div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none mt-8 whitespace-nowrap bg-gradient-to-b from-foreground/10 to-transparent bg-clip-text text-center text-[14vw] font-bold leading-none tracking-tighter text-transparent"
        >
          NODOOS AI
        </div>
      </div>
    </footer>
  );
}
