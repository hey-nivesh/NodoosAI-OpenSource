"use client";

import { useState, useEffect } from "react";
import { Zap, AlertTriangle, CheckCircle, ShieldAlert, Edit2, Check, X } from "lucide-react";
import { fetchPlaybooks, type PlaybookRule } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PLAYBOOK_OPTIONS = [
  "EXECUTIVE_ESCALATION",
  "DEDICATED_CSM_ASSIGNMENT",
  "EXECUTIVE_DISCOUNT_REVIEW",
  "HIGH_TOUCH_CSM_OUTREACH",
  "AUTOMATED_NURTURE_SEQUENCE",
  "EMERGENCY_INTERVENTION",
];

export default function PlaybooksPage() {
  const [rules, setRules] = useState<PlaybookRule[]>([]);
  const [source, setSource] = useState("default");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "csm">("csm");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlaybookRule>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch profile for role
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile) setRole(profile.role as "admin" | "csm");
        }

        const data = await fetchPlaybooks();
        setRules(data.playbooks);
        setSource(data.source);
      } catch (err: any) {
        setError("Failed to load playbook rules.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStartEdit = (rule: PlaybookRule) => {
    if (!rule.id) {
      setError("This is a default system rule. System rules cannot be inline edited until they are seeded in the database. Please contact your database administrator.");
      return;
    }
    setEditingId(rule.id);
    setEditForm({ ...rule });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const handleSaveClick = (ruleId: string) => {
    setShowConfirm(ruleId);
  };

  const handleConfirmSave = async (ruleId: string) => {
    setError(null);
    setSuccess(null);
    setShowConfirm(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to modify playbooks.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/playbooks/${ruleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          playbook_name: editForm.playbook_name,
          arr_threshold_min: editForm.arr_threshold_min,
          arr_threshold_max: editForm.arr_threshold_max,
          description: editForm.description,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update playbook rule");
      }

      const updatedRule = await res.json();
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updatedRule } : r));
      setEditingId(null);
      setSuccess("Playbook rule updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save rule.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
          <Zap className="h-3.5 w-3.5" />
          Playbooks Matrix
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Playbooks & Rules Matrix</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define which playbooks run automatically based on customer root causes and ARR thresholds.
        </p>
      </div>

      {/* Explainer Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-accent" />
          How it works
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          These rules run automatically every time the agent detects a usage anomaly. The agent determines
          the root cause using LLM Sentiment analysis on support tickets, evaluates the customer's ARR,
          and triggers the corresponding playbook. CSMs have read-only access. Only Admins can modify thresholds
          or playbook assignments.
        </p>
      </div>

      {/* Source Indicator */}
      {source === "default" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0" />
          Viewing default system rules matrix. Custom rule definitions will be loaded once created.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      {/* Main Rules Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Root Cause</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ARR Tier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min ARR ($)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max ARR ($)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Playbook</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                {role === "admin" && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    {[...Array(7)].map((_, i) => (
                      <td key={i} className="px-4 py-3.5">
                        <div className="h-4 rounded bg-muted animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No rules found in matrix.
                  </td>
                </tr>
              ) : (
                rules.map((rule, idx) => {
                  const isEditing = editingId === rule.id;
                  return (
                    <tr key={rule.id || idx} className="hover:bg-muted/10">
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {rule.root_cause.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {rule.arr_tier_label}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.arr_threshold_min ?? 0}
                            onChange={e => setEditForm(prev => ({ ...prev, arr_threshold_min: Number(e.target.value) }))}
                            className="w-24 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:border-accent"
                          />
                        ) : (
                          `$${(rule.arr_threshold_min).toLocaleString()}`
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.arr_threshold_max ?? ""}
                            placeholder="Unlimited"
                            onChange={e => setEditForm(prev => ({ ...prev, arr_threshold_max: e.target.value ? Number(e.target.value) : null }))}
                            className="w-24 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:border-accent"
                          />
                        ) : rule.arr_threshold_max ? (
                          `$${(rule.arr_threshold_max).toLocaleString()}`
                        ) : (
                          "Unlimited"
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <select
                            value={editForm.playbook_name ?? ""}
                            onChange={e => setEditForm(prev => ({ ...prev, playbook_name: e.target.value }))}
                            className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:border-accent"
                          >
                            {PLAYBOOK_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            {rule.playbook_name.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.description ?? ""}
                            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:border-accent"
                          />
                        ) : (
                          rule.description ?? "—"
                        )}
                      </td>
                      {role === "admin" && (
                        <td className="px-4 py-3.5 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveClick(rule.id!)}
                                className="rounded-lg p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="rounded-lg p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(rule)}
                              className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full border border-border shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Are you sure?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This changes live agent behavior. Newly detected usage anomalies will immediately evaluate against
              these parameters and trigger different rescue playbooks.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSave(showConfirm)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
