"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "../../lib/api";

type Lang = "en" | "ar";

const content = {
  en: {
    brand: "HerAI Mashroo3",
    back: "← Back to login",
    title: "Create new password",
    subtitle:
      "Please enter your new password below to regain access to your account.",
    newPasswordLabel: "New password",
    newPasswordPlaceholder: "Enter new password",
    confirmPasswordLabel: "Confirm new password",
    confirmPasswordPlaceholder: "Confirm your new password",
    resetTokenLabel: "Reset Token (if not detected in link)",
    resetTokenPlaceholder: "Paste your reset token here",
    submitButton: "Update password",
    submitting: "Updating password...",
    passwordHint: "Must be at least 6 characters.",
    mismatchError: "Passwords do not match.",
    tokenRequired: "Please provide a valid reset token.",
    required: "Please fill in all fields.",
    successTitle: "Password updated successfully!",
    successMessage:
      "Your password has been changed. You can now log in with your new credentials.",
    loginButton: "Go to login",
    genericError: "Failed to reset password. Please request a new link.",
  },
  ar: {
    brand: "HerAI Mashroo3",
    back: "العودة لتسجيل الدخول ←",
    title: "إنشاء كلمة مرور جديدة",
    subtitle:
      "اكتبي كلمة المرور الجديدة أدناه لتتمكني من الدخول إلى حسابكِ من جديد.",
    newPasswordLabel: "كلمة المرور الجديدة",
    newPasswordPlaceholder: "اكتبي كلمة المرور الجديدة",
    confirmPasswordLabel: "تأكيد كلمة المرور الجديدة",
    confirmPasswordPlaceholder: "أعيدي كتابة كلمة المرور",
    resetTokenLabel: "رمز إعادة التعيين (إذا لم يتم التعرف عليه تلقائيًا)",
    resetTokenPlaceholder: "الصقي رمز إعادة التعيين هنا",
    submitButton: "تحديث كلمة المرور",
    submitting: "جاري التحديث...",
    passwordHint: "يجب أن تكون 6 أحرف على الأقل.",
    mismatchError: "كلمتا المرور غير متطابقتين.",
    tokenRequired: "يرجى إدخال رمز إعادة تعيين صالح.",
    required: "يرجى ملء جميع الحقول المطلوبة.",
    successTitle: "تم تحديث كلمة المرور بنجاح!",
    successMessage:
      "تم تغيير كلمة المرور الخاصة بحسابكِ. يمكنكِ الآن تسجيل الدخول بكلمة المرور الجديدة.",
    loginButton: "الانتقال لتسجيل الدخول",
    genericError: "تعذر إعادة تعيين كلمة المرور. يرجى طلب رابط جديد.",
  },
} as const;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [languageReady, setLanguageReady] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  // Extract access token from URL hash or query params if redirected by Supabase
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check hash (#access_token=...&type=recovery)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      if (accessToken) {
        setToken(accessToken);
        return;
      }
    }

    // Check query (?token=... or ?access_token=...)
    const queryParams = new URLSearchParams(window.location.search);
    const queryToken =
      queryParams.get("token") ||
      queryParams.get("access_token") ||
      queryParams.get("code");

    if (queryToken) {
      setToken(queryToken);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  function toggleLanguage() {
    setLang((c) => (c === "en" ? "ar" : "en"));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError(t.required);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordHint);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.mismatchError);
      return;
    }

    const effectiveToken = token.trim() || localStorage.getItem("herai_access_token") || "";

    if (!effectiveToken) {
      setError(t.tokenRequired);
      setShowTokenInput(true);
      return;
    }

    setLoading(true);

    try {
      await resetPassword(password, effectiveToken);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.genericError
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(184,134,11,0.025)_35%,transparent_65%)]" />
      <div className="pointer-events-none absolute left-[-180px] top-[-140px] h-[500px] w-[500px] rounded-full bg-[#B8860B]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-200px] right-[-150px] h-[550px] w-[550px] rounded-full bg-[#B8860B]/[0.045] blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight cursor-default select-none">
            {t.brand}
          </span>

          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-xs font-medium backdrop-blur-sm transition hover:border-[#B8860B]/50 hover:shadow-sm"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-xl py-12 sm:py-16">
          <div className="mb-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-[#1A1A1A]/50 transition hover:text-[#1A1A1A]"
            >
              {t.back}
            </Link>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.title}
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#1A1A1A]/60">
              {t.subtitle}
            </p>
          </div>

          {/* CARD */}
          <div className="relative overflow-hidden rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8860B]/70 to-transparent" />

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NEW PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {t.newPasswordLabel}
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.newPasswordPlaceholder}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    dir="ltr"
                    className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />
                  <p className="mt-1.5 text-xs text-[#1A1A1A]/40">
                    {t.passwordHint}
                  </p>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {t.confirmPasswordLabel}
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    dir="ltr"
                    className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />
                </div>

                {/* TOKEN INPUT (SHOWN IF NOT IN URL) */}
                {showTokenInput && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#1A1A1A]/60">
                      {t.resetTokenLabel}
                    </label>

                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder={t.resetTokenPlaceholder}
                      dir="ltr"
                      className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-xs outline-none transition font-mono placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B]"
                    />
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md shadow-[#B8860B]/15 transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? t.submitting : t.submitButton}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                  ✓
                </div>

                <h2 className="mt-5 text-xl font-semibold text-green-800">
                  {t.successTitle}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#1A1A1A]/65">
                  {t.successMessage}
                </p>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md shadow-[#B8860B]/15 transition hover:bg-[#96700A]"
                  >
                    {t.loginButton}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="pb-8 text-center text-xs text-[#1A1A1A]/35">
          A DEVONEERS initiative
        </div>
      </div>
    </main>
  );
}
