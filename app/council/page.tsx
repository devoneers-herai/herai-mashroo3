"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCouncilMembers,
  approveCouncilMember,
  rejectCouncilMember,
  CouncilMember,
} from "../../lib/api";

type Lang = "en" | "ar";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

const content = {
  en: {
    brand: "HerAI Mashroo3",
    profile: "Profile",
    logOut: "Log out",
    badge: "HerAI Governance",
    title: "Council Dashboard",
    subtitle:
      "Review incoming membership application forms with applicant qualifications, and configure regional AI domain safety rules.",
    
    tabs: {
      pending: "Pending Applications",
      approved: "Approved Members",
      rejected: "Rejected Applications",
      rules: "⚖️ AI Safety Rules",
    },

    searchPlaceholder: "Search applicants by name, email, or domain...",
    loadingRequests: "Loading council requests...",
    noRequests: "No applications found in this section.",
    requestedOn: "Submitted on",
    applicantInfo: "Applicant Profile",
    viewApplication: "View Application Form",
    hideApplication: "Hide Application Form",
    
    applicationSections: {
      motivation: "Motivation & Interest",
      experience: "Relevant Experience & Knowledge",
      contribution: "Proposed Contribution to Council",
      availability: "Time Availability & Commitment",
      noAnswers: "No written application answers recorded for this user.",
    },

    actions: {
      approve: "Approve Application",
      reject: "Reject Application",
      approving: "Approving...",
      rejecting: "Rejecting...",
    },

    rulesSection: {
      title: "Add New Regional AI Rule",
      subtitle:
        "Rules are verified and injected into the AI system prompt for users matching the designated domain and region.",
      ruleTitle: "Rule Title *",
      domain: "Domain",
      region: "Region",
      ruleText: "Rule Content / Policy Instruction *",
      placeholderTitle: "e.g. Egypt Agricultural Water Advisory",
      placeholderText:
        "e.g. In dry regions, caution against heavy water-consuming irrigation systems and advise water-efficient crop cycles.",
      allDomains: "All domains (Global)",
      allRegions: "All regions (Global)",
      addButton: "Publish Rule",
      saving: "Saving rule...",
      deleteButton: "Delete",
      noRules: "No safety rules configured yet. Add a new rule above.",
      loadingRules: "Loading AI safety rules...",
    },

    footer: "A DEVONEERS initiative",
  },

  ar: {
    brand: "HerAI Mashroo3",
    profile: "الملف الشخصي",
    logOut: "تسجيل الخروج",
    badge: "حوكمة HerAI",
    title: "لوحة تحكم المجلس",
    subtitle:
      "مراجعة استمارات التقديم لعضوية المجلس وتقييم دوافع وخبرات المتقدمات، وإدارة قواعد أمان الذكاء الاصطناعي الإقليمية.",

    tabs: {
      pending: "الطلبات المعلقة",
      approved: "العضوات المعتمدات",
      rejected: "الطلبات المرفوضة",
      rules: "⚖️ قواعد أمان الذكاء الاصطناعي",
    },

    searchPlaceholder: "بحث عن متقدمة بالاسم، البريد، أو المجال...",
    loadingRequests: "جاري تحميل الطلبات...",
    noRequests: "لا توجد طلبات في هذا القسم.",
    requestedOn: "تاريخ التقديم",
    applicantInfo: "بيانات المتقدمة",
    viewApplication: "استعراض استمارة التقديم",
    hideApplication: "إخفاء استمارة التقديم",

    applicationSections: {
      motivation: "الدافع وسبب الانضمام",
      experience: "الخبرة والمعرفة المرتبطة",
      contribution: "كيفية المساهمة في أمان وحوكمة المجلس",
      availability: "الوقت المتاح والالتزام الواقعي",
      noAnswers: "لا توجد إجابات استمارة مسجلة لهذه العضوية.",
    },

    actions: {
      approve: "قبول الطلب",
      reject: "رفض الطلب",
      approving: "جاري القبول...",
      rejecting: "جاري الرفض...",
    },

    rulesSection: {
      title: "إضافة قاعدة أمان جديدة للذكاء الاصطناعي",
      subtitle:
        "تُطبق هذه القواعد وتُحقن في توجيهات الذكاء الاصطناعي للمستخدمين وفقًا للمجال والمنطقة المحددة.",
      ruleTitle: "عنوان القاعدة *",
      domain: "المجال",
      region: "المنطقة",
      ruleText: "نص القاعدة والتوجيه الإرشادي *",
      placeholderTitle: "مثال: إرشادات الري في مصر",
      placeholderText:
        "مثال: في المناطق الجافة، تجنبي التوصية بمحاصيل تستهلك كميات مياه كبيرة واقترحي البدائل الملائمة للمناخ.",
      allDomains: "كافة المجالات (عام)",
      allRegions: "كافة المناطق (عام)",
      addButton: "نشر القاعدة",
      saving: "جاري الحفظ...",
      deleteButton: "حذف",
      noRules: "لا توجد قواعد أمان مضافة حاليًا. يمكنكِ إضافة قاعدة جديدة أعلاه.",
      loadingRules: "جاري تحميل القواعد...",
    },

    footer: "مبادرة من DEVONEERS",
  },
} as const;

export default function CouncilPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [languageReady, setLanguageReady] = useState(false);

  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [rules, setRules] = useState<CouncilRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected" | "rules"
  >("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // New rule form
  const [newRule, setNewRule] = useState({
    title: "",
    rule_text: "",
    domain: "",
    region_code: "",
  });
  const [savingRule, setSavingRule] = useState(false);
  const [ruleError, setRuleError] = useState("");

  const t = content[lang];

  useEffect(() => {
    const stored = localStorage.getItem("herai_language");
    if (stored === "ar" || stored === "en") {
      setLang(stored);
    }
    setLanguageReady(true);
  }, []);

  useEffect(() => {
    if (!languageReady) return;
    localStorage.setItem("herai_language", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang, languageReady]);

  function toggleLanguage() {
    setLang((c) => (c === "en" ? "ar" : "en"));
  }

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
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${API_URL}/api/council/members?status=${activeTab}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const body = await res.json();
      if (!res.ok) {
        setError(`Error ${res.status}: ${body?.error || JSON.stringify(body)}`);
        setMembers([]);
        return;
      }
      setMembers(body);
      setError("");
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
      const res = await fetch(`${API_URL}/api/council/rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) {
        setRuleError(`Error ${res.status}: ${body?.error}`);
        return;
      }
      setRules(body);
      setRuleError("");
    } catch (err: any) {
      setRuleError(`Network error: ${err.message}`);
    } finally {
      setRulesLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveCouncilMember(userId, getToken());
      fetchMembers();
    } catch (err: any) {
      alert("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectCouncilMember(userId, getToken());
      fetchMembers();
    } catch (err: any) {
      alert("Failed to reject: " + err.message);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.title || !newRule.rule_text) {
      setRuleError("Title and rule text are required.");
      return;
    }
    try {
      setSavingRule(true);
      setRuleError("");
      const res = await fetch(`${API_URL}/api/council/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(newRule),
      });
      const body = await res.json();
      if (!res.ok) {
        setRuleError(body?.error || "Failed to save rule");
        return;
      }
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
      const res = await fetch(`${API_URL}/api/council/rules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const b = await res.json();
        alert("Delete failed: " + b.error);
        return;
      }
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

  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.toLowerCase();
    const email = (m.user?.email || "").toLowerCase();
    const domain = (m.user?.domain || "").toLowerCase();
    const id = m.user_id.toLowerCase();
    return name.includes(q) || email.includes(q) || domain.includes(q) || id.includes(q);
  });

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
          <span className="text-lg font-semibold tracking-tight cursor-default select-none">
            {t.brand}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-xs font-medium backdrop-blur-sm transition hover:border-[#B8860B]/50 hover:shadow-sm"
            >
              {lang === "en" ? "عربي" : "EN"}
            </button>

            <Link
              href="/profile"
              className="rounded-full border border-[#1A1A1A]/10 bg-white px-5 py-2.5 text-xs font-semibold text-[#1A1A1A] transition hover:bg-[#1A1A1A]/5"
            >
              {t.profile}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#333]"
            >
              {t.logOut}
            </button>
          </div>
        </header>

        <section className="py-12 sm:py-16">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
              {t.badge}
            </span>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.title}
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-[#1A1A1A]/60">
              {t.subtitle}
            </p>
          </div>

          {error && activeTab !== "rules" && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-7 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">
            {/* TABS */}
            <div className="mb-8 flex gap-2 sm:gap-6 border-b border-[#1A1A1A]/10 pb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab("pending")}
                className={`pb-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === "pending"
                    ? "border-b-2 border-[#B8860B] text-[#B8860B]"
                    : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                }`}
              >
                {t.tabs.pending}
              </button>

              <button
                onClick={() => setActiveTab("approved")}
                className={`pb-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === "approved"
                    ? "border-b-2 border-[#B8860B] text-[#B8860B]"
                    : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                }`}
              >
                {t.tabs.approved}
              </button>

              <button
                onClick={() => setActiveTab("rejected")}
                className={`pb-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === "rejected"
                    ? "border-b-2 border-[#B8860B] text-[#B8860B]"
                    : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                }`}
              >
                {t.tabs.rejected}
              </button>

              <button
                onClick={() => setActiveTab("rules")}
                className={`pb-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === "rules"
                    ? "border-b-2 border-[#B8860B] text-[#B8860B]"
                    : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                }`}
              >
                {t.tabs.rules}
              </button>
            </div>

            {/* MEMBERS CONTENT (APPLICATIONS REVIEW) */}
            {activeTab !== "rules" && (
              <div>
                {/* SEARCH INPUT */}
                <div className="mb-6">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/40 px-4 py-3 text-xs outline-none transition placeholder:text-[#1A1A1A]/35 focus:border-[#B8860B] focus:bg-white"
                  />
                </div>

                {loading ? (
                  <div className="flex h-36 flex-col items-center justify-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#B8860B]/20 border-t-[#B8860B]" />
                    <p className="mt-4 text-sm text-[#1A1A1A]/50">
                      {t.loadingRequests}
                    </p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-[#1A1A1A]/10 bg-[#FBF7EC]/40 text-sm text-[#1A1A1A]/50">
                    {t.noRequests}
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {filteredMembers.map((member) => {
                      const isExpanded = expandedMemberId === member.id;
                      const hasAnswers =
                        member.motivation ||
                        member.experience ||
                        member.contribution ||
                        member.availability;

                      const applicantName =
                        member.user?.first_name || member.user?.last_name
                          ? `${member.user?.first_name || ""} ${
                              member.user?.last_name || ""
                            }`.trim()
                          : `Applicant (${member.user_id.split("-")[0]}...)`;

                      return (
                        <div
                          key={member.id}
                          className="rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/30 p-6 transition-all hover:border-[#B8860B]/30 hover:shadow-md"
                        >
                          {/* CARD HEADER */}
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h3 className="text-base font-semibold text-[#1A1A1A]">
                                  {applicantName}
                                </h3>

                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                    member.status === "approved"
                                      ? "border border-green-200 bg-green-100/60 text-green-800"
                                      : member.status === "rejected"
                                      ? "border border-red-200 bg-red-100/60 text-red-800"
                                      : "border border-[#B8860B]/20 bg-[#B8860B]/10 text-[#96700A]"
                                  }`}
                                >
                                  {member.status}
                                </span>
                              </div>

                              {member.user?.email && (
                                <p dir="ltr" className="text-xs text-[#1A1A1A]/60">
                                  ✉️ {member.user.email}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-xs text-[#1A1A1A]/50">
                                {member.user?.domain && (
                                  <span>💼 {member.user.domain}</span>
                                )}
                                {member.user?.country && (
                                  <span>
                                    📍 {member.user.country}{" "}
                                    {member.user.city ? `(${member.user.city})` : ""}
                                  </span>
                                )}
                                {member.user?.phone_number && (
                                  <span dir="ltr">📞 {member.user.phone_number}</span>
                                )}
                              </div>

                              <p className="text-[11px] text-[#B8860B] font-medium pt-1">
                                {t.requestedOn}:{" "}
                                {new Date(member.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMemberId(
                                    isExpanded ? null : member.id
                                  )
                                }
                                className="rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-xs font-semibold text-[#1A1A1A] transition hover:bg-[#FBF7EC]"
                              >
                                {isExpanded
                                  ? t.hideApplication
                                  : t.viewApplication}
                              </button>

                              {activeTab === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(member.user_id)}
                                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                  >
                                    {t.actions.reject}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleApprove(member.user_id)}
                                    className="rounded-full bg-[#B8860B] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#96700A]"
                                  >
                                    {t.actions.approve}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* EXPANDABLE APPLICATION REVIEW FORM */}
                          {isExpanded && (
                            <div className="mt-6 border-t border-[#1A1A1A]/10 pt-5 space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                                📋 {t.viewApplication}
                              </h4>

                              {hasAnswers ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                  {/* MOTIVATION */}
                                  <div className="rounded-xl border border-[#1A1A1A]/8 bg-white p-4">
                                    <p className="text-xs font-semibold text-[#1A1A1A]/70">
                                      🎯 {t.applicationSections.motivation}
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-[#1A1A1A]/80 whitespace-pre-wrap">
                                      {member.motivation || "—"}
                                    </p>
                                  </div>

                                  {/* EXPERIENCE */}
                                  <div className="rounded-xl border border-[#1A1A1A]/8 bg-white p-4">
                                    <p className="text-xs font-semibold text-[#1A1A1A]/70">
                                      💼 {t.applicationSections.experience}
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-[#1A1A1A]/80 whitespace-pre-wrap">
                                      {member.experience || "—"}
                                    </p>
                                  </div>

                                  {/* CONTRIBUTION */}
                                  <div className="rounded-xl border border-[#1A1A1A]/8 bg-white p-4">
                                    <p className="text-xs font-semibold text-[#1A1A1A]/70">
                                      🌟 {t.applicationSections.contribution}
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-[#1A1A1A]/80 whitespace-pre-wrap">
                                      {member.contribution || "—"}
                                    </p>
                                  </div>

                                  {/* AVAILABILITY */}
                                  <div className="rounded-xl border border-[#1A1A1A]/8 bg-white p-4">
                                    <p className="text-xs font-semibold text-[#1A1A1A]/70">
                                      ⏱️ {t.applicationSections.availability}
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-[#1A1A1A]/80 whitespace-pre-wrap">
                                      {member.availability || "—"}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-[#1A1A1A]/50 italic">
                                  {t.applicationSections.noAnswers}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* RULES CONTENT */}
            {activeTab === "rules" && (
              <div>
                {/* ADD RULE FORM */}
                <div className="mb-8 rounded-2xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-6">
                  <h3 className="mb-2 text-base font-semibold text-[#1A1A1A]">
                    {t.rulesSection.title}
                  </h3>

                  <p className="mb-5 text-xs leading-5 text-[#1A1A1A]/55">
                    {t.rulesSection.subtitle}
                  </p>

                  <form onSubmit={handleAddRule} className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">
                          {t.rulesSection.ruleTitle}
                        </label>
                        <input
                          value={newRule.title}
                          onChange={(e) =>
                            setNewRule((p) => ({ ...p, title: e.target.value }))
                          }
                          placeholder={t.rulesSection.placeholderTitle}
                          className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">
                            {t.rulesSection.domain}
                          </label>
                          <select
                            value={newRule.domain}
                            onChange={(e) =>
                              setNewRule((p) => ({
                                ...p,
                                domain: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B8860B]"
                          >
                            {DOMAINS.map((d) => (
                              <option key={d} value={d}>
                                {d || t.rulesSection.allDomains}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">
                            {t.rulesSection.region}
                          </label>
                          <select
                            value={newRule.region_code}
                            onChange={(e) =>
                              setNewRule((p) => ({
                                ...p,
                                region_code: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B8860B]"
                          >
                            {REGIONS.map((r) => (
                              <option key={r} value={r}>
                                {r || t.rulesSection.allRegions}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#1A1A1A]/60">
                        {t.rulesSection.ruleText}
                      </label>
                      <textarea
                        value={newRule.rule_text}
                        onChange={(e) =>
                          setNewRule((p) => ({
                            ...p,
                            rule_text: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder={t.rulesSection.placeholderText}
                        className="w-full rounded-xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 resize-none"
                      />
                    </div>

                    {ruleError && (
                      <p className="text-xs text-red-600">{ruleError}</p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingRule}
                        className="rounded-full bg-[#B8860B] px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-[#96700A] disabled:opacity-50"
                      >
                        {savingRule
                          ? t.rulesSection.saving
                          : t.rulesSection.addButton}
                      </button>
                    </div>
                  </form>
                </div>

                {/* EXISTING RULES */}
                {rulesLoading ? (
                  <div className="flex h-24 items-center justify-center text-sm text-[#1A1A1A]/50">
                    {t.rulesSection.loadingRules}
                  </div>
                ) : rules.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-[#1A1A1A]/10 bg-[#FBF7EC]/40 text-sm text-[#1A1A1A]/50">
                    {t.rulesSection.noRules}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/20 p-5"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-sm text-[#1A1A1A]">
                              {rule.title}
                            </h4>
                            {rule.domain && (
                              <span className="rounded-full bg-[#B8860B]/10 px-2.5 py-0.5 text-xs font-medium text-[#B8860B]">
                                {rule.domain}
                              </span>
                            )}
                            {rule.region_code && (
                              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                                {rule.region_code}
                              </span>
                            )}
                            {!rule.domain && !rule.region_code && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                                Global
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-[#1A1A1A]/60">
                            {rule.rule_text}
                          </p>
                          <p className="mt-2 text-xs text-[#1A1A1A]/40">
                            Added {new Date(rule.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="shrink-0 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          {t.rulesSection.deleteButton}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-[#1A1A1A]/10 py-8 text-center text-xs text-[#1A1A1A]/35">
          {t.footer}
        </footer>
      </div>
    </main>
  );
}
