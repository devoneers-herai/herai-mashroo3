"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applyForCouncil, getCouncilStatus } from "../../lib/api";

type Lang = "en" | "ar";

type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type CouncilState =
  | "loading"
  | "none"
  | "pending"
  | "approved"
  | "rejected";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const translations = {
  en: {
    brand: "HerAI Mashroo3",
    languageButton: "عربي",

    loading: "Loading...",

    logIn: "Log in",
    logOut: "Log out",

    notLoggedIn: "You're not logged in",
    notLoggedInText:
      "Please log in to access and manage your HerAI account.",

    profileLabel: "HerAI Account",
    profileTitle: "Your profile",
    welcomeBack: "Welcome back",
    welcomeText:
      "Manage your HerAI account and access your business guidance from one place.",

    councilMember: "Council Member",
    councilPending: "Application pending",

    noEmail: "No email provided",
    openChat: "Open HerAI Chat",

    accountInfo: "Account information",
    accountInfoSub: "Your personal account details.",

    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    notProvided: "Not provided",

    applicationSubmitted:
      "Your application has been submitted successfully. Existing council members can now review and approve your request.",

    mustLogin: "You must be logged in to apply.",
    submitFailed: "Failed to submit application.",

    councilDashboard: "Council Dashboard",
    approvedCouncilText:
      "You are an approved HerAI Council member. Review pending membership applications and help configure regional AI domain rules.",
    openDashboard: "Open Dashboard",

    applicationPending: "Council application pending",
    pendingText:
      "Your application to join the HerAI Council has been submitted and is currently under review by existing council members.",
    underReview: "Under review",

    councilApplication: "Council application",
    joinCouncil: "Join the HerAI Council",

    rejectedText:
      "Your previous council request was not approved. You may submit a new application.",

    joinCouncilText:
      "Council members help guide HerAI safety policies, validate agricultural and business domain knowledge, and review new community rules.",

    submitting: "Submitting...",
    reapply: "Re-apply for Council",
    apply: "Apply for Council",

    footer: "A DEVONEERS initiative",
    defaultUser: "HerAI User",
    welcomeFallback: "there",

    profileSummary: "Profile overview",
    accountEmail: "Account email",
    activeAccount: "Active account",
    councilStatus: "Council status",
    accountSectionLabel: "Account",
    accountVerified: "Account access is active",
  },

  ar: {
    brand: "HerAI Mashroo3",
    languageButton: "EN",

    loading: "جارٍ التحميل...",

    logIn: "تسجيل الدخول",
    logOut: "تسجيل الخروج",

    notLoggedIn: "أنتِ غير مسجلة الدخول",
    notLoggedInText:
      "يرجى تسجيل الدخول للوصول إلى حسابكِ وإدارته على HerAI.",

    profileLabel: "حساب HerAI",
    profileTitle: "ملفك الشخصي",
    welcomeBack: "أهلًا بعودتكِ",
    welcomeText:
      "يمكنكِ إدارة حسابكِ على HerAI والوصول إلى إرشاداتكِ الخاصة بالأعمال من مكان واحد.",

    councilMember: "عضوة في المجلس",
    councilPending: "الطلب قيد المراجعة",

    noEmail: "لم يتم إدخال بريد إلكتروني",
    openChat: "افتحي محادثة HerAI",

    accountInfo: "معلومات الحساب",
    accountInfoSub: "بيانات حسابكِ الشخصية.",

    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    notProvided: "غير متوفر",

    applicationSubmitted:
      "تم إرسال طلبكِ بنجاح. يمكن لأعضاء المجلس الحاليين الآن مراجعة طلبكِ والموافقة عليه.",

    mustLogin: "يجب تسجيل الدخول أولًا لتقديم الطلب.",
    submitFailed: "تعذر إرسال الطلب.",

    councilDashboard: "لوحة تحكم المجلس",
    approvedCouncilText:
      "أنتِ عضوة معتمدة في مجلس HerAI. يمكنكِ مراجعة طلبات العضوية المعلقة والمساعدة في إدارة قواعد المجالات الإقليمية للذكاء الاصطناعي.",
    openDashboard: "افتحي لوحة التحكم",

    applicationPending: "طلب الانضمام إلى المجلس قيد المراجعة",
    pendingText:
      "تم إرسال طلبكِ للانضمام إلى مجلس HerAI وهو حاليًا قيد المراجعة من قبل أعضاء المجلس الحاليين.",
    underReview: "قيد المراجعة",

    councilApplication: "طلب الانضمام إلى المجلس",
    joinCouncil: "انضمي إلى مجلس HerAI",

    rejectedText:
      "لم تتم الموافقة على طلبكِ السابق للانضمام إلى المجلس. يمكنكِ تقديم طلب جديد.",

    joinCouncilText:
      "يساعد أعضاء المجلس في توجيه سياسات الأمان في HerAI، والتحقق من المعرفة في مجالات الزراعة والأعمال، ومراجعة قواعد المجتمع الجديدة.",

    submitting: "جارٍ الإرسال...",
    reapply: "أعيدي التقديم للمجلس",
    apply: "قدّمي طلب الانضمام إلى المجلس",

    footer: "مبادرة من DEVONEERS",
    defaultUser: "مستخدمة HerAI",
    welcomeFallback: "هناك",

    profileSummary: "نظرة عامة",
    accountEmail: "البريد المرتبط بالحساب",
    activeAccount: "حساب نشط",
    councilStatus: "حالة المجلس",
    accountSectionLabel: "الحساب",
    accountVerified: "الوصول إلى الحساب نشط",
  },
} as const;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [lang, setLang] = useState<Lang>("en");
  const [languageReady, setLanguageReady] = useState(false);

  const [councilStatus, setCouncilStatus] =
    useState<CouncilState>("loading");

  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");

  const t = translations[lang];

  useEffect(() => {
    const storedLanguage = localStorage.getItem("herai_language");

    const savedLang: Lang =
      storedLanguage === "ar" ? "ar" : "en";

    setLang(savedLang);

    document.documentElement.lang = savedLang;
    document.documentElement.dir =
      savedLang === "ar" ? "rtl" : "ltr";

    setLanguageReady(true);
  }, []);

  useEffect(() => {
    if (!languageReady) return;

    localStorage.setItem("herai_language", lang);

    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === "ar" ? "rtl" : "ltr";
  }, [lang, languageReady]);

  useEffect(() => {
    const storedUser = localStorage.getItem("herai_user");
    let currentUser: User | null = null;

    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
        setUser(currentUser);
      } catch {
        localStorage.removeItem("herai_user");
      }
    }

    const token = localStorage.getItem(
      "herai_access_token"
    );

    if (token && currentUser?.id) {
      getCouncilStatus(currentUser.id, token)
        .then((member) => {
          if (member?.status) {
            setCouncilStatus(member.status);
            return;
          }

          fetch(
            `${API_URL}/api/council/members?status=approved`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
            .then((res) => {
              setCouncilStatus(
                res.ok ? "approved" : "none"
              );
            })
            .catch(() => {
              setCouncilStatus("none");
            });
        })
        .catch(() => {
          setCouncilStatus("none");
        });
    } else {
      setCouncilStatus("none");
    }

    setLoading(false);
  }, []);

  function toggleLanguage() {
    setLang((currentLang) =>
      currentLang === "en" ? "ar" : "en"
    );
  }

  async function handleApplyCouncil() {
    setApplying(true);
    setApplyError("");
    setApplyMessage("");

    const token = localStorage.getItem(
      "herai_access_token"
    );

    if (!token) {
      setApplyError(t.mustLogin);
      setApplying(false);
      return;
    }

    try {
      const result = await applyForCouncil(token);

      setCouncilStatus(result.status || "pending");
      setApplyMessage(t.applicationSubmitted);
    } catch (err: unknown) {
      setApplyError(
        err instanceof Error
          ? err.message
          : t.submitFailed
      );
    } finally {
      setApplying(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("herai_user");
    localStorage.removeItem("herai_session");
    localStorage.removeItem("herai_access_token");
    localStorage.removeItem("herai_refresh_token");

    window.location.href = "/login";
  }

  if (!languageReady || loading) {
    return (
      <main
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FBF7EC]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(184,134,11,0.025)_35%,transparent_65%)]" />

        <div className="pointer-events-none absolute left-[-180px] top-[-140px] h-[500px] w-[500px] rounded-full bg-[#B8860B]/[0.06] blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-200px] right-[-150px] h-[550px] w-[550px] rounded-full bg-[#B8860B]/[0.045] blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#1A1A1A]/10 border-t-[#B8860B]" />

          <p className="mt-5 text-sm text-[#1A1A1A]/45">
            {t.loading}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="relative min-h-screen overflow-hidden bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(184,134,11,0.04)_45%,transparent_72%)]" />

        <div className="pointer-events-none absolute left-[-200px] top-[-180px] h-[600px] w-[600px] rounded-full bg-[#B8860B]/[0.06] blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-180px] right-[-150px] h-[500px] w-[500px] rounded-full bg-[#B8860B]/[0.04] blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight transition hover:opacity-70"
            >
              {t.brand}
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleLanguage}
                className="rounded-full border border-[#1A1A1A]/10 bg-white/80 px-4 py-2 text-xs font-medium backdrop-blur-sm transition hover:border-[#B8860B]/40 hover:bg-white hover:shadow-sm"
              >
                {t.languageButton}
              </button>

              <Link
                href="/login"
                className="rounded-full bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#333]"
              >
                {t.logIn}
              </Link>
            </div>
          </header>

          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_25px_80px_rgba(26,26,26,0.08)] backdrop-blur-xl sm:p-10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8860B]/70 to-transparent" />

              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#B8860B]/[0.06] blur-3xl" />

              <div className="relative">
                <div className="mx-auto h-1 w-12 rounded-full bg-[#B8860B]" />

                <h1 className="mt-8 text-3xl font-semibold tracking-tight">
                  {t.notLoggedIn}
                </h1>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#1A1A1A]/55">
                  {t.notLoggedInText}
                </p>

                <Link
                  href="/login"
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white shadow-lg shadow-[#B8860B]/15 transition hover:-translate-y-0.5 hover:bg-[#96700A]"
                >
                  {t.logIn}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    t.defaultUser;

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isCouncil = councilStatus === "approved";

  const statusText =
    councilStatus === "approved"
      ? t.councilMember
      : councilStatus === "pending"
      ? t.councilPending
      : t.activeAccount;

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8"
    >
      {/* SUBTLE DIAGONAL BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_25%,rgba(184,134,11,0.025)_50%,transparent_75%)]" />

      <div className="pointer-events-none absolute left-[-260px] top-[120px] h-[700px] w-[700px] rounded-full bg-[#B8860B]/[0.045] blur-3xl" />

      <div className="pointer-events-none absolute right-[-280px] top-[350px] h-[650px] w-[650px] rounded-full bg-[#B8860B]/[0.035] blur-3xl" />

      <div className="pointer-events-none absolute left-1/2 top-[-300px] h-[650px] w-[1000px] -translate-x-1/2 rotate-[-12deg] rounded-full bg-gradient-to-br from-[#B8860B]/[0.07] via-[#B8860B]/[0.025] to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight transition hover:opacity-70"
          >
            {t.brand}
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full border border-[#1A1A1A]/10 bg-white/80 px-4 py-2 text-xs font-medium backdrop-blur-sm transition hover:border-[#B8860B]/40 hover:bg-white hover:shadow-sm"
            >
              {t.languageButton}
            </button>

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
          {/* INTRO */}
          <div className="relative mb-12 max-w-2xl">
            <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[#B8860B]/[0.045] blur-3xl" />

            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8860B]">
                {t.profileLabel}
              </span>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                {t.profileTitle}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-[#1A1A1A]/55">
                {t.welcomeBack},{" "}
                <span className="font-medium text-[#1A1A1A]/75">
                  {user.firstName || t.welcomeFallback}
                </span>
                . {t.welcomeText}
              </p>
            </div>
          </div>

          {/* PROFILE HERO */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_25px_90px_rgba(26,26,26,0.07)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8860B]/70 to-transparent" />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(184,134,11,0.035)_55%,transparent_100%)]" />

            <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[#B8860B]/[0.07] blur-3xl" />

            <div className="relative p-7 sm:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5 sm:gap-6">
                  <div className="relative">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] border border-[#B8860B]/20 bg-gradient-to-br from-[#B8860B]/20 via-[#B8860B]/10 to-transparent text-xl font-semibold tracking-tight text-[#96700A] shadow-sm">
                      {initials}
                    </div>

                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white bg-[#B8860B]" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {fullName}
                      </h2>

                      {(isCouncil ||
                        councilStatus === "pending") && (
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            isCouncil
                              ? "border-[#B8860B]/20 bg-[#B8860B]/10 text-[#96700A]"
                              : "border-[#1A1A1A]/10 bg-[#1A1A1A]/[0.03] text-[#1A1A1A]/55"
                          }`}
                        >
                          {statusText}
                        </span>
                      )}
                    </div>

                    <p
                      dir="ltr"
                      className="mt-2 text-sm text-[#1A1A1A]/45"
                    >
                      {user.email || t.noEmail}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-[#1A1A1A]/35">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B8860B]" />
                      <span>{t.accountVerified}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/chat"
                  className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-lg shadow-[#B8860B]/15 transition hover:-translate-y-0.5 hover:bg-[#96700A]"
                >
                  {t.openChat}

                  <span
                    className={`transition ${
                      lang === "ar"
                        ? "group-hover:-translate-x-0.5"
                        : "group-hover:translate-x-0.5"
                    }`}
                  >
                    {lang === "ar" ? "←" : "→"}
                  </span>
                </Link>
              </div>

              {/* PROFILE METADATA */}
              <div className="mt-10 grid gap-3 border-t border-[#1A1A1A]/8 pt-7 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1A1A1A]/5 bg-gradient-to-br from-[#FBF7EC] to-white px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]/35">
                    {t.profileSummary}
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {fullName}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#1A1A1A]/5 bg-gradient-to-br from-[#FBF7EC] to-white px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]/35">
                    {t.accountEmail}
                  </p>

                  <p className="mt-2 truncate text-sm font-medium">
                    {user.email || t.notProvided}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#1A1A1A]/5 bg-gradient-to-br from-[#FBF7EC] to-white px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]/35">
                    {t.councilStatus}
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {statusText}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ACCOUNT INFORMATION */}
          <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_20px_70px_rgba(26,26,26,0.045)] backdrop-blur-xl sm:p-10">
            <div className="pointer-events-none absolute right-[-120px] top-[-100px] h-72 w-72 rounded-full bg-[#B8860B]/[0.035] blur-3xl" />

            <div className="relative">
              <div className="flex flex-col gap-2 border-b border-[#1A1A1A]/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                    {t.accountSectionLabel}
                  </span>

                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                    {t.accountInfo}
                  </h3>

                  <p className="mt-2 text-sm text-[#1A1A1A]/50">
                    {t.accountInfoSub}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="group rounded-2xl border border-[#1A1A1A]/8 bg-gradient-to-br from-[#FBF7EC]/80 to-white p-5 transition hover:-translate-y-0.5 hover:border-[#B8860B]/25 hover:shadow-md hover:shadow-[#B8860B]/5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1A1A1A]/35">
                    {t.firstName}
                  </p>

                  <p className="mt-3 text-base font-semibold">
                    {user.firstName || t.notProvided}
                  </p>
                </div>

                <div className="group rounded-2xl border border-[#1A1A1A]/8 bg-gradient-to-br from-[#FBF7EC]/80 to-white p-5 transition hover:-translate-y-0.5 hover:border-[#B8860B]/25 hover:shadow-md hover:shadow-[#B8860B]/5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1A1A1A]/35">
                    {t.lastName}
                  </p>

                  <p className="mt-3 text-base font-semibold">
                    {user.lastName || t.notProvided}
                  </p>
                </div>

                <div className="group rounded-2xl border border-[#1A1A1A]/8 bg-gradient-to-br from-[#FBF7EC]/80 to-white p-5 transition hover:-translate-y-0.5 hover:border-[#B8860B]/25 hover:shadow-md hover:shadow-[#B8860B]/5 sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1A1A1A]/35">
                    {t.email}
                  </p>

                  <p
                    dir="ltr"
                    className="mt-3 break-all text-base font-semibold"
                  >
                    {user.email || t.notProvided}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SUCCESS MESSAGE */}
          {applyMessage && (
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#B8860B]/20 bg-white/90 p-5 shadow-sm">
              <div className="absolute inset-y-0 left-0 w-1 bg-[#B8860B]" />

              <p className="pl-2 text-sm leading-6 text-[#1A1A1A]/70">
                {applyMessage}
              </p>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {applyError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-5">
              <p className="text-sm leading-6 text-red-800">
                {applyError}
              </p>
            </div>
          )}

          {/* APPROVED COUNCIL MEMBER */}
          {councilStatus === "approved" && (
            <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-[#B8860B]/20 bg-white/90 p-7 shadow-[0_20px_70px_rgba(184,134,11,0.06)] backdrop-blur-xl sm:p-9">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(184,134,11,0.09)_0%,rgba(251,247,236,0.5)_45%,transparent_75%)]" />

              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#B8860B]/10 blur-3xl" />

              <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#B8860B]/20 bg-[#B8860B]/10 text-sm">
                      🏛️
                    </span>

                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#96700A]">
                      {t.councilMember}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold tracking-tight">
                    {t.councilDashboard}
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-[#1A1A1A]/55">
                    {t.approvedCouncilText}
                  </p>
                </div>

                <Link
                  href="/council"
                  className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-full bg-[#1A1A1A] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#333]"
                >
                  {t.openDashboard}

                  <span
                    className={`transition ${
                      lang === "ar"
                        ? "group-hover:-translate-x-0.5"
                        : "group-hover:translate-x-0.5"
                    }`}
                  >
                    {lang === "ar" ? "←" : "→"}
                  </span>
                </Link>
              </div>
            </section>
          )}

          {/* PENDING COUNCIL REQUEST */}
          {councilStatus === "pending" && (
            <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-[#B8860B]/15 bg-white/90 p-7 shadow-[0_20px_60px_rgba(26,26,26,0.04)] backdrop-blur-xl sm:p-9">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(184,134,11,0.045),transparent_55%)]" />

              <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#B8860B]" />

                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                      {t.councilStatus}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                    {t.applicationPending}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#1A1A1A]/55">
                    {t.pendingText}
                  </p>
                </div>

                <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[#B8860B]/20 bg-[#B8860B]/[0.08] px-5 text-xs font-semibold text-[#96700A]">
                  {t.underReview}
                </span>
              </div>
            </section>
          )}

          {/* NOT APPLIED OR REJECTED */}
          {(councilStatus === "none" ||
            councilStatus === "rejected") && (
            <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_20px_70px_rgba(26,26,26,0.045)] backdrop-blur-xl sm:p-9">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(184,134,11,0.035)_50%,transparent_100%)]" />

              <div className="pointer-events-none absolute -left-20 bottom-[-130px] h-64 w-64 rounded-full bg-[#B8860B]/[0.05] blur-3xl" />

              <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                    {t.councilApplication}
                  </span>

                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                    {councilStatus === "rejected"
                      ? t.councilApplication
                      : t.joinCouncil}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#1A1A1A]/55">
                    {councilStatus === "rejected"
                      ? t.rejectedText
                      : t.joinCouncilText}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={applying}
                  onClick={handleApplyCouncil}
                  className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-full bg-[#1A1A1A] px-7 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applying
                    ? t.submitting
                    : councilStatus === "rejected"
                    ? t.reapply
                    : t.apply}

                  {!applying && (
                    <span
                      className={`transition ${
                        lang === "ar"
                          ? "group-hover:-translate-x-0.5"
                          : "group-hover:translate-x-0.5"
                      }`}
                    >
                      {lang === "ar" ? "←" : "→"}
                    </span>
                  )}
                </button>
              </div>
            </section>
          )}
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#1A1A1A]/10 py-8 text-xs text-[#1A1A1A]/35 sm:flex-row">
          <span>{t.footer}</span>

          <div
            dir="ltr"
            className="flex items-center gap-3 text-[10px] font-medium tracking-[0.16em]"
          >
            <span>HERAI</span>
            <span className="h-1 w-1 rounded-full bg-[#B8860B]/60" />
            <span>DEVONEERS</span>
          </div>
        </footer>
      </div>
    </main>
  );
}