const logos = ["Snowflake", "Salesforce", "Stripe", "Zendesk", "HubSpot", "Notion"];

export function LogoCloud() {
  return (
    <section id="integrations" className="border-y border-border/60 bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Trusted By Industry Leaders Worldwide
        </p>
        <div className="mt-8 grid grid-cols-3 items-center gap-6 md:grid-cols-6">
          {logos.map((l) => (
            <div
              key={l}
              className="text-center text-lg font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
