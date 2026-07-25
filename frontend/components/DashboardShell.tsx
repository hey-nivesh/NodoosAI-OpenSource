"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { fetchNotifications } from "@/lib/api";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    async function getNotifs() {
      try {
        const notifs = await fetchNotifications({ unread_only: true });
        setUnreadNotifsCount(notifs.unread_count || 0);
      } catch {}
    }
    getNotifs();
    const interval = setInterval(getNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex h-full shrink-0">
        <DashboardSidebar />
      </div>

      {/* Sidebar Drawer for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex h-full w-60 flex-col animate-slide-in">
            <DashboardSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadNotifsCount}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
