"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  History,
  Activity,
  Zap,
  Settings,
  Bell,
  HelpCircle,
  Rocket,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "At-Risk Accounts", icon: ShieldAlert },
  { href: "/dashboard/audit", label: "Audit Trail", icon: History },
  { href: "/dashboard/signals", label: "Live Signals", icon: Activity },
  { href: "/dashboard/playbooks", label: "Playbooks", icon: Zap },
];

const bottomNav = [
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/help", label: "Help Center", icon: HelpCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
  atRiskCount?: number;
}

export function DashboardSidebar({ onNavigate, atRiskCount }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const handleLinkClick = () => {
    if (onNavigate) onNavigate();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col border-r border-white/10"
      style={{ background: "oklch(0.18 0.04 265)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <Image
          src="/nodoos-logo.png"
          alt="Nodoos AI"
          width={50}
          height={50}
          className="object-contain"
        />
        <div>
          <div className="text-sm font-bold tracking-tight text-white">NODOOS AI</div>
          <div className="text-[10px] font-medium" style={{ color: "oklch(0.7 0.12 262)" }}>
            Churn Rescue Suite
          </div>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(0.55 0.08 262)" }}>
          Main Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={handleLinkClick}
              className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "text-white shadow-md"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
              style={
                active
                  ? { background: "oklch(0.58 0.19 262)" }
                  : {}
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
              {label === "At-Risk Accounts" && atRiskCount != null && atRiskCount > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white min-w-[18px] h-[18px]"
                  style={{ background: "oklch(0.65 0.22 25)" }}
                >
                  {atRiskCount}
                </span>
              )}
            </Link>
          );
        })}

        <p className="mt-5 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(0.55 0.08 262)" }}>
          System
        </p>
        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
              style={active ? { background: "oklch(0.58 0.19 262)" } : {}}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout & Upgrade Section */}
      <div className="p-3 space-y-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>

        <div
          className="rounded-2xl p-4"
          style={{ background: "oklch(0.58 0.19 262 / 0.18)", border: "1px solid oklch(0.58 0.19 262 / 0.3)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">Go Enterprise</span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "oklch(0.7 0.1 262)" }}>
            Unlock dedicated cluster, custom LLM fine-tuning, and SOC2 compliance.
          </p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "oklch(0.58 0.19 262)" }}
          >
            Upgrade Plan
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
