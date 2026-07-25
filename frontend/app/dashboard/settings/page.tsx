"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Settings, User, Building, Users, Slack, CreditCard, CheckCircle, AlertCircle, Trash2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchSlackIntegration, disconnectSlack, fetchOrgMembers, fetchOrg } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function SettingsTabsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [org, setOrg] = useState<any>(null);
  const [orgName, setOrgName] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [slack, setSlack] = useState<any>({ connected: false });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingOrg, setUpdatingOrg] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [slackDisconnecting, setSlackDisconnecting] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Profile forms
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setUserProfile({ ...user, ...profile });
          setFullName(profile?.full_name || "");
        }

        const [orgData, membersData, slackData] = await Promise.all([
          fetchOrg(),
          fetchOrgMembers(),
          fetchSlackIntegration(),
        ]);

        setOrg(orgData);
        if (orgData) setOrgName(orgData.name);
        setMembers(membersData.members || []);
        setSlack(slackData);
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      setProfileError("No active user profile found.");
      return;
    }
    setUpdatingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;

      // Update in profiles table as well
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userProfile.id);
      if (profileError) throw profileError;

      setProfileSuccess("Profile updated successfully.");
      setUserProfile((prev: any) => prev ? { ...prev, full_name: fullName } : null);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setUpdatingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setProfileSuccess("Password updated successfully.");
      setPassword("");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update password");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingOrg(true);
    setOrgSuccess(null);
    setOrgError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const res = await fetch(`${API_BASE}/api/org`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: orgName }),
      });

      if (!res.ok) throw new Error("Failed to update organization");

      const updated = await res.json();
      setOrg((prev: any) => ({ ...prev, name: updated.name }));
      setOrgSuccess("Organization updated successfully.");
    } catch (err: any) {
      setOrgError(err.message || "Failed to update organization");
    } finally {
      setUpdatingOrg(false);
    }
  };

  const handleInviteTeammate = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setTeamSuccess(null);
    setTeamError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const res = await fetch(`${API_BASE}/api/org/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to invite teammate");
      }

      setTeamSuccess(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail("");
    } catch (err: any) {
      setTeamError(err.message || "Failed to invite teammate");
    } finally {
      setInviting(false);
    }
  };

  const handleDisconnectSlack = async () => {
    setSlackDisconnecting(true);
    try {
      await disconnectSlack();
      setSlack({ connected: false });
    } catch (err) {
      console.error("Disconnect Slack failed:", err);
    } finally {
      setSlackDisconnecting(false);
    }
  };

  const handleConnectSlack = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_BASE}/api/slack/authorize-url`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error("Slack OAuth redirect failed", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 rounded bg-muted animate-pulse w-32" />
        <div className="h-40 rounded-2xl border border-border bg-surface animate-pulse" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "organization", label: "Organization", icon: Building },
    { id: "team", label: "Team", icon: Users },
    { id: "integrations", label: "Integrations", icon: Slack },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile, organization settings, team members, integrations, and billing.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible border-b lg:border-b-0 lg:border-r border-border pb-4 lg:pb-0 lg:pr-4 gap-1 shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(`/dashboard/settings?tab=${tab.id}`);
                }}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3 space-y-6">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Personal Details
                </h3>
                {profileSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    {profileError}
                  </div>
                )}
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-sm">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={userProfile?.email || ""}
                      className="mt-1.5 w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Save Profile
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={updatingProfile || !password}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Change Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ORGANIZATION TAB */}
          {activeTab === "organization" && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Organization Details</h3>
              {orgSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  {orgSuccess}
                </div>
              )}
              {orgError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  {orgError}
                </div>
              )}
              <form onSubmit={handleUpdateOrg} className="space-y-4 max-w-sm">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    disabled={userProfile?.role !== "admin"}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent disabled:bg-muted disabled:cursor-not-allowed"
                  />
                  {userProfile?.role !== "admin" && (
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Only organization admins can modify workspace details.
                    </span>
                  )}
                </div>
                {org?.created_at && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Created Date
                    </label>
                    <div className="text-xs text-foreground mt-1">
                      {new Date(org.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {userProfile?.role === "admin" && (
                  <button
                    type="submit"
                    disabled={updatingOrg}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                )}
              </form>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === "team" && (
            <div className="space-y-6">
              {/* Invite Teammate Card */}
              {userProfile?.role === "admin" && (
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Invite Teammate</h3>
                  {teamSuccess && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      {teamSuccess}
                    </div>
                  )}
                  {teamError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      {teamError}
                    </div>
                  )}
                  <form onSubmit={handleInviteTeammate} className="flex flex-wrap items-end gap-3 max-w-md">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Teammate Email
                      </label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="csm@company.com"
                          className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Invite Teammate
                    </button>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-background/50">
                  <h3 className="text-sm font-bold text-foreground">Team Members ({members.length})</h3>
                </div>
                <div className="divide-y divide-border">
                  {members.map(member => (
                    <div key={member.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white bg-accent">
                          {member.full_name?.[0] ?? "M"}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">{member.full_name}</div>
                          <div className="text-[10px] text-muted-foreground">Joined {new Date(member.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground capitalize">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === "integrations" && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Slack className="h-5 w-5 text-orange-500" />
                Slack Alert Routing
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                Connect your organization's Slack workspace to deliver alerts automatically to a designated channel.
                Alerts contain root causes, AI sentiment analysis summaries, and recommended playbooks.
              </p>

              <div className="border border-border rounded-xl p-4 max-w-md bg-background/40">
                {slack.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-foreground">Connected Workspace</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{slack.team_name}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Connected
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Target Channel</div>
                      <div className="text-xs text-muted-foreground mt-0.5">#{slack.default_channel}</div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border/60">
                      <button
                        onClick={handleConnectSlack}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        Reconnect
                      </button>
                      <button
                        onClick={handleDisconnectSlack}
                        disabled={slackDisconnecting}
                        className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      No Slack integration configured for this organization workspace. Playbook alerts will only show up inside the application.
                    </div>
                    <button
                      onClick={handleConnectSlack}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                    >
                      <Slack className="h-3.5 w-3.5" />
                      Connect Slack Workspace
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Subscription Plan</h3>
              <div className="border border-border rounded-xl p-4 max-w-sm bg-background/40">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Free Trial Plan</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">14-day evaluation environment</span>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                    Active
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Monthly Cost</span>
                  <span className="font-bold text-foreground">$0.00</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading settings…</div>}>
      <SettingsTabsContent />
    </Suspense>
  );
}
