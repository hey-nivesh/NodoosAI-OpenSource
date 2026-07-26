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
  ChevronLeft,
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({
  onNavigate,
  atRiskCount,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
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
      className="relative flex h-full flex-col border-r border-white/10 transition-all duration-300 ease-in-out select-none"
      style={{
        background: "oklch(0.18 0.04 265)",
        width: isCollapsed ? "76px" : "240px",
      }}
    >
      {/* Collapse Trigger Button (Visible on Desktop only) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 z-50 hidden md:grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-background text-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
          style={{ background: "oklch(0.18 0.04 265)", borderColor: "rgba(255,255,255,0.15)" }}
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 text-white transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Logo Section */}
      <div
        className={`flex items-center border-b border-white/10 transition-all duration-300 ${
          isCollapsed ? "justify-center px-2 py-4" : "gap-2.5 px-5 py-5"
        }`}
      >
        <div className="relative flex-shrink-0">
          <Image
            src="/nodoos-logo.png"
            alt="Nodoos AI"
            width={40}
            height={40}
            className="object-contain transition-all duration-300"
          />
        </div>
        <div
          className={`flex flex-col transition-all duration-300 origin-left ${
            isCollapsed
              ? "opacity-0 w-0 max-w-0 overflow-hidden pointer-events-none scale-90"
              : "opacity-100 w-auto max-w-[150px]"
          }`}
        >
          <div className="text-sm font-bold tracking-tight text-white whitespace-nowrap">NODOOS AI</div>
          <div
            className="text-[10px] font-medium whitespace-nowrap"
            style={{ color: "oklch(0.7 0.12 262)" }}
          >
            Churn Rescue Suite
          </div>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {/* Main Menu Label / Line */}
        {isCollapsed ? (
          <div className="border-t border-white/10 my-2 mx-1 transition-all duration-300" />
        ) : (
          <p
            className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest transition-opacity duration-300"
            style={{ color: "oklch(0.55 0.08 262)" }}
          >
            Main Menu
          </p>
        )}

        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const hasCount = label === "At-Risk Accounts" && atRiskCount != null && atRiskCount > 0;

          return (
            <Link
              key={href}
              href={href}
              onClick={handleLinkClick}
              title={isCollapsed ? label : undefined}
              className={`group relative flex items-center rounded-xl p-2.5 text-sm font-medium transition-all ${
                active
                  ? "text-white shadow-md"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              } ${isCollapsed ? "justify-center" : "justify-between"}`}
              style={active ? { background: "oklch(0.58 0.19 262)" } : {}}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icon className="h-4 w-4 shrink-0" />
                  {isCollapsed && hasCount && (
                    <span
                      className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold text-white animate-pulse"
                      style={{ background: "oklch(0.65 0.22 25)" }}
                    >
                      {atRiskCount}
                    </span>
                  )}
                </div>
                <span
                  className={`transition-all duration-300 origin-left whitespace-nowrap ${
                    isCollapsed
                      ? "opacity-0 w-0 max-w-0 overflow-hidden pointer-events-none scale-75"
                      : "opacity-100 w-auto ml-0"
                  }`}
                >
                  {label}
                </span>
              </div>

              {!isCollapsed && hasCount && (
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

        {/* System Menu Label / Line */}
        {isCollapsed ? (
          <div className="border-t border-white/10 my-4 mx-1 transition-all duration-300" />
        ) : (
          <p
            className="mt-5 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest transition-opacity duration-300"
            style={{ color: "oklch(0.55 0.08 262)" }}
          >
            System
          </p>
        )}

        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={handleLinkClick}
              title={isCollapsed ? label : undefined}
              className={`flex items-center rounded-xl p-2.5 text-sm font-medium transition-all ${
                active
                  ? "text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              } ${isCollapsed ? "justify-center" : "gap-3"}`}
              style={active ? { background: "oklch(0.58 0.19 262)" } : {}}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={`transition-all duration-300 origin-left whitespace-nowrap ${
                  isCollapsed
                    ? "opacity-0 w-0 max-w-0 overflow-hidden pointer-events-none scale-75"
                    : "opacity-100 w-auto ml-0"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout & Upgrade Section */}
      <div className="p-3 space-y-2 border-t border-white/10 bg-black/10">
        <button
          onClick={handleSignOut}
          title={isCollapsed ? "Sign Out" : undefined}
          className={`flex w-full items-center rounded-xl p-2.5 text-sm font-medium text-white/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span
            className={`transition-all duration-300 origin-left whitespace-nowrap ${
              isCollapsed
                ? "opacity-0 w-0 max-w-0 overflow-hidden pointer-events-none scale-75"
                : "opacity-100 w-auto"
            }`}
          >
            Sign Out
          </span>
        </button>

        {isCollapsed ? (
          <Link
            href="/dashboard/settings?tab=billing"
            title="Go Enterprise"
            className="flex h-10 w-full items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-white transition-all hover:bg-primary/20"
          >
            <Rocket className="h-4 w-4 text-accent animate-pulse" />
          </Link>
        ) : (
          <div
            className="rounded-2xl p-4 transition-all duration-300"
            style={{
              background: "oklch(0.58 0.19 262 / 0.18)",
              border: "1px solid oklch(0.58 0.19 262 / 0.3)",
            }}
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
        )}
      </div>
    </aside>
  );
}
