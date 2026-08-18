"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCouncilMembers, approveCouncilMember, rejectCouncilMember, CouncilMember } from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type CouncilRule = {
  id: string;
  title: string;
  rule_text: string;
  domain: string | null;
  region_code: string | null;
  is_active: boolean;
  created_at: string;
};

const DOMAINS = ["", "agriculture", "healthcare", "education", "business"];
const REGIONS = ["", "EG", "SA", "AE", "MA", "TN", "JO"];

export default function CouncilPage() {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [rules, setRules] = useState<CouncilRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "rules">("pending");
  const [debugInfo, setDebugInfo] = useState("");

  // New rule form
  const [newRule, setNewRule] = useState({ title: "", rule_text: "", domain: "", region_code: "" });
  const [savingRule, setSavingRule] = useState(false);
  const [ruleError, setRuleError] = useState("");

  useEffect(() => {
    if (activeTab === "rules") {
      fetchRules();
    } else {
      fetchMembers();
    }
  }, [activeTab]);

  const getToken = () => localStorage.getItem("herai_access_token") || "";

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) { setError("No token found. Please log out and log back in."); setLoading(false); return; }
      setDebugInfo(`Token: ${token.substring(0, 20)}...`);
      const res = await fetch(`${API_URL}/api/council/members?status=${activeTab}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) { setError(`Error ${res.status}: ${body?.error || JSON.stringify(body)}`); setMembers([]); return; }
      setMembers(body); setError("");
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      setRulesLoading(true);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/council/rules`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) { setRuleError(`Error ${res.status}: ${body?.error}`); return; }
      setRules(body); setRuleError("");
    } catch (err: any) {
      setRuleError(`Network error: ${err.message}`);
    } finally {
      setRulesLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try { await approveCouncilMember(userId, getToken()); fetchMembers(); }
    catch (err: any) { alert("Failed to approve: " + err.message); }
  };

  const handleReject = async (userId: string) => {
    try { await rejectCouncilMember(userId, getToken()); fetchMembers(); }
    catch (err: any) { alert("Failed to reject: " + err.message); }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.title || !newRule.rule_text) { setRuleError("Title and rule text are required."); return; }
    try {
      setSavingRule(true); setRuleError("");
      const res = await fetch(`${API_URL}/api/council/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(newRule),
      });
      const body = await res.json();
      if (!res.ok) { setRuleError(body?.error || "Failed to save rule"); return; }
      setNewRule({ title: "", rule_text: "", domain: "", region_code: "" });
      fetchRules();
    } catch (err: any) {
      setRuleError(`Error: ${err.message}`);
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      const res = await fetch(`${API_URL}/api/council/rules/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) { const b = await res.json(); alert("Delete failed: " + b.error); return; }
      fetchRules();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  function handleLogout() {
    localStorage.removeItem("herai_user");
    localStorage.removeItem("herai_session");
    localStorage.removeItem("herai_access_token");
    window.location.href = "/login";
  }

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "rules", label: "⚖️ AI Rules" },
  ] as const;

  return (
    <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">HerAI Mashroo3</Link>
          <div className="flex gap-3">
            <Link href="/profile" className="rounded-full border border-[#1A1A1A]/10 px-5 py-2.5 text-xs font-semibold text-[#1A1A1A] transition hover:bg-[#1A1A1A]/5">Profile</Link>
            <button type="button" onClick={handleLogout} className="rounded-full bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#333]">Log out</button>
          </div>
        </header>

        <section className="py-12 sm:py-16">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">HerAI</span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Council Dashboard</h1>
            <p className="mt-4 max-w-xl leading-7 text-[#1A1A1A]/60">Manage membership requests and configure AI rules for each domain and region.</p>
          </div>

          {debugInfo && activeTab !== "rules" && (
            <div className="mb-3 rounded-xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-3 text-xs font-mono text-[#B8860B]">{debugInfo}</div>
          )}
          {error && activeTab !== "rules" && (
            <div className="mb-6 rounded-[1rem] border border-red-200 bg-red-50 p-5 text-sm text-red-600">
              <strong>Error:</strong> {error}
              <br />
              <button onClick={() => { localStorage.removeItem("herai_access_token"); window.location.href = "/login"; }} className="mt-3 inline-block rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white">Log out &amp; log back in</button>
            </div>
          )}

          <div className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-7 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">
            {/* TABS */}
            <div className="mb-8 flex gap-2 sm:gap-6 border-b border-[#1A1A1A]/10 pb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`pb-4 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-b-2 border-[#B8860B] text-[#B8860B]" : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"}`}>
                  {tab.label} Requests
                </button>
              ))}
            </div>

            {/* MEMBERS CONTENT */}
            {activeTab !== "rules" && (
              loading ? (
                <div className="flex h-32 flex-col items-center justify-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#B8860B]/20 border-t-[#B8860B]" />
                  <p className="mt-4 text-sm text-[#1A1A1A]/50">Loading requests...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-[#1A1A1A]/10 bg-[#FBF7EC]/40 text-sm text-[#1A1A1A]/50">
                  No {activeTab} requests found.
                </div>
              ) : (
                <div className="grid gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/20 p-5 transition-shadow hover:shadow-md">
                      <div>
                        <h3 className="font-semibold text-[#1A1A1A] text-sm">User ID: {member.user_id.split("-")[0]}...</h3>
                        <p className="mt-1 text-xs text-[#1A1A1A]/50 font-mono" title={member.user_id}>{member.user_id}</p>
                        <p className="mt-2 text-xs font-medium text-[#B8860B]">Requested on: {new Date(member.created_at).toLocaleDateString()}</p>
                      </div>
                      {activeTab === "pending" && (
                        <div className="flex gap-3 shrink-0">
                          <button onClick={() => handleReject(member.user_id)} className="rounded-full border border-[#1A1A1A]/10 bg-white px-5 py-2 text-xs font-semibold text-[#1A1A1A] transition hover:bg-red-50 hover:text-red-700 hover:border-red-200">Reject</button>
                          <button onClick={() => handleApprove(member.user_id)} className="rounded-full bg-[#B8860B] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#96700A]">Approve</button>
                        </div>
                      )}
                      {activeTab !== "pending" && (
                        <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${activeTab === "approved" ? "bg-green-100/50 text-green-700 border border-green-200" : "bg-red-100/50 text-red-700 border border-red-200"}`}>{activeTab}</span>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* RULES CONTENT */}
            {activeTab === "rules" && (
              <div>
                {/* ADD RULE FORM */}
                <div className="mb-8 rounded-2xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-6">
                  <h3 className="mb-4 text-base font-semibold text-[#1A1A1A]">Add New AI Rule</h3>
                  <p className="mb-5 text-xs leading-5 text-[#1A1A1A]/55">Rules are injected into the AI's system prompt for users matching the selected domain and region. Leave domain/region blank to apply globally.</p>
                  <form onSubmit={handleAddRule} className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">Rule Title *</label>
                        <input value={newRule.title} onChange={e => setNewRule(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Egypt Crop Restrictions" className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">Domain</label>
                          <select value={newRule.domain} onChange={e => setNewRule(p => ({ ...p, domain: e.target.value }))} className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B8860B]">
                            {DOMAINS.map(d => <option key={d} value={d}>{d || "All domains"}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">Region</label>
                          <select value={newRule.region_code} onChange={e => setNewRule(p => ({ ...p, region_code: e.target.value }))} className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B8860B]">
                            {REGIONS.map(r => <option key={r} value={r}>{r || "All regions"}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">Rule Text *</label>
                      <textarea value={newRule.rule_text} onChange={e => setNewRule(p => ({ ...p, rule_text: e.target.value }))} rows={3} placeholder="e.g. In Egypt, bananas and tropical fruits cannot grow due to the dry climate. Do not recommend these crops." className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 resize-none" />
                    </div>
                    {ruleError && <p className="text-xs text-red-600">{ruleError}</p>}
                    <div className="flex justify-end">
                      <button type="submit" disabled={savingRule} className="rounded-full bg-[#B8860B] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#96700A] disabled:opacity-50">
                        {savingRule ? "Saving..." : "Add Rule"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* EXISTING RULES */}
                {rulesLoading ? (
                  <div className="flex h-24 items-center justify-center text-sm text-[#1A1A1A]/50">Loading rules...</div>
                ) : rules.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-[#1A1A1A]/10 bg-[#FBF7EC]/40 text-sm text-[#1A1A1A]/50">No rules yet. Add your first rule above!</div>
                ) : (
                  <div className="grid gap-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/20 p-5">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-sm text-[#1A1A1A]">{rule.title}</h4>
                            {rule.domain && <span className="rounded-full bg-[#B8860B]/10 px-2.5 py-0.5 text-xs font-medium text-[#B8860B]">{rule.domain}</span>}
                            {rule.region_code && <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">{rule.region_code}</span>}
                            {!rule.domain && !rule.region_code && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">Global</span>}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-[#1A1A1A]/60">{rule.rule_text}</p>
                          <p className="mt-2 text-xs text-[#1A1A1A]/40">Added {new Date(rule.created_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleDeleteRule(rule.id)} className="shrink-0 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-[#1A1A1A]/10 py-8 text-center text-xs text-[#1A1A1A]/35">A DEVONEERS initiative</footer>
      </div>
    </main>
  );
}
