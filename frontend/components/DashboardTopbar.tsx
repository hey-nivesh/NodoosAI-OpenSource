"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  onMenuClick: () => void;
  unreadCount?: number;
  title?: string;
}

export function DashboardTopbar({ onMenuClick, unreadCount = 0, title }: TopbarProps) {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        setProfile({
          name: data?.full_name || user.email?.split("@")[0] || "User",
          role: data?.role || "CSM",
        });
      }
    }
    loadProfile();
  }, [supabase]);

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-md">
      {/* Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="block md:hidden rounded-xl p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm md:text-base font-bold tracking-tight text-foreground">
          {title ?? "Dashboard Overview"}
        </h1>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search accounts, playbooks..."
            className="w-64 rounded-full border border-border bg-background py-1.5 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:border-accent"
          />
        </div>

        {/* Notifications Bell */}
        <Link
          href="/dashboard/notifications"
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-surface"
              style={{ background: "oklch(0.65 0.22 25)" }}
            />
          )}
        </Link>

        {/* User Profile Info */}
        <Link
          href="/dashboard/settings?tab=profile"
          className="flex items-center gap-2 rounded-full border border-border bg-surface p-1 pr-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "oklch(0.58 0.19 262)" }}
          >
            {initials}
          </div>
          <span className="hidden sm:inline-block max-w-[100px] truncate">
            {profile?.name || "Loading..."}
          </span>
        </Link>
      </div>
    </header>
  );
}
