"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckSquare, MessageSquare, AlertTriangle, RefreshCw, Slack } from "lucide-react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, fetchSlackIntegration, type Notification, type SlackIntegration } from "@/lib/api";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [slack, setSlack] = useState<SlackIntegration>({ connected: false });
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [loadingSlack, setLoadingSlack] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [notifsData, slackData] = await Promise.all([
        fetchNotifications(),
        fetchSlackIntegration(),
      ]);
      setNotifications(notifsData.notifications);
      setUnreadCount(notifsData.unread_count);
      setSlack(slackData);
    } catch (err) {
      setError("Failed to load notifications or integration status.");
    } finally {
      setLoadingNotifs(false);
      setLoadingSlack(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
    setActionLoading(false);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "playbook_triggered":
        return <Check className="h-4 w-4 text-emerald-600" />;
      case "slack_error":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case "agent_run_complete":
        return <CheckSquare className="h-4 w-4 text-blue-600" />;
      case "slack_not_connected":
        return <Slack className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotifClass = (type: string, read: boolean) => {
    let base = "flex items-start gap-4 rounded-2xl border p-4 transition-all ";
    if (read) {
      base += "border-border bg-surface/50 opacity-70";
    } else {
      base += "border-border bg-surface shadow-sm";
      if (type === "slack_error" || type === "slack_not_connected") {
        base += " border-l-4 border-l-rose-500";
      } else {
        base += " border-l-4 border-l-accent";
      }
    }
    return base;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
            <Bell className="h-3.5 w-3.5" />
            In-App Notifications
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alerts & Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keep track of playbook runs, webhook activity, and agent status.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Slack Connection Status Pinned Card */}
      {!loadingSlack && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50">
                <Slack className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Slack Integration</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {slack.connected
                    ? `Connected to workspace: "${slack.team_name}" in channel #${slack.default_channel}`
                    : "Instantly route playbook alerts to your CSM Slack channel."}
                </p>
              </div>
            </div>
            {slack.connected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Connected
              </span>
            ) : (
              <Link
                href="/dashboard/settings?tab=integrations"
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                Connect Slack
              </Link>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center justify-between">
          {error}
          <button onClick={loadData} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Notifications List */}
      {loadingNotifs ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-border bg-surface animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
          <p className="text-sm font-semibold text-foreground">All caught up!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No notifications logged for your organization.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className={getNotifClass(n.type, n.read)}
              onClick={() => !n.read && handleMarkRead(n.id)}
              style={{ cursor: n.read ? "default" : "pointer" }}
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                {getNotifIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-xs font-bold text-foreground truncate">{n.title}</h4>
                  {!n.read && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent mt-1" />
                  )}
                </div>
                {n.body && (
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                )}
                <span className="text-[10px] text-muted-foreground mt-1.5 block">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
