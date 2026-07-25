import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/nodoos-logo.png";

const nav = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <a href="#" className="flex items-center gap-2">
          <img src={logo} alt="Nodoos AI" className="h-9 w-9 object-contain" />
          <span className="text-base font-semibold tracking-tight text-foreground">NODOOS AI</span>
          <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-accent">
            CLI 2.0
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#pricing"
            className="hidden rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] md:inline-flex"
          >
            Launch Agent →
          </a>
          <button
            className="rounded-md p-2 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden">
          <div className="flex flex-col gap-3 px-4 py-4">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
                {n.label}
              </a>
            ))}
            <a href="#pricing" className="mt-2 rounded-full bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
              Launch Agent →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
