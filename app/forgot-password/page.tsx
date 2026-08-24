"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../../lib/api";

type Lang = "en" | "ar";

const content = {
  en: {
    brand: "HerAI Mashroo3",
    back: "← Back to login",
    title: "Reset your password",
    subtitle:
      "Enter your account email address and we will send you instructions to reset your password.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submitButton: "Send reset link",
    submitting: "Sending instructions...",
    successTitle: "Check your email",
    successMessage:
      "If an account exists for this email, you will receive password reset instructions shortly.",
    rememberPassword: "Remember your password?",
    logIn: "Log in",
    required: "Please enter your email address.",
    genericError: "Something went wrong. Please try again.",
    didNotReceive: "Didn't receive the email?",
    tryAgain: "Try again",
  },
  ar: {
    brand: "HerAI Mashroo3",
    back: "العودة لتسجيل الدخول ←",
    title: "استعادة كلمة المرور",
    subtitle:
      "اكتبي بريدكِ الإلكتروني وسنرسل لكِ تعليمات إعادة تعيين كلمة المرور الخاصة بحسابكِ.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    submitButton: "إرسال رابط الاستعادة",
    submitting: "جاري الإرسال...",
    successTitle: "تفقدّي بريدكِ الإلكتروني",
    successMessage:
      "إذا كان هذا البريد مسجلاً لدينا، فستصلكِ رسالة تتضمن تعليمات إعادة تعيين كلمة المرور في أقرب وقت.",
    rememberPassword: "تذكرتِ كلمة المرور؟",
    logIn: "تسجيل الدخول",
    required: "من فضلكِ اكتبي بريدكِ الإلكتروني.",
    genericError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    didNotReceive: "لم تصلكِ الرسالة؟",
    tryAgain: "حاولي مرة أخرى",
  },
} as const;

export default function ForgotPasswordPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [languageReady, setLanguageReady] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t.required);
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
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

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {t.emailLabel}
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    autoComplete="email"
                    dir="ltr"
                    className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />
                </div>

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
                  ✉️
                </div>

                <h2 className="mt-5 text-xl font-semibold text-[#1A1A1A]">
                  {t.successTitle}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#1A1A1A]/65">
                  {t.successMessage}
                </p>

                <div className="mt-6 rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/50 p-4 text-xs text-[#1A1A1A]/60">
                  <span>{t.didNotReceive} </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setError("");
                    }}
                    className="font-semibold text-[#B8860B] hover:underline"
                  >
                    {t.tryAgain}
                  </button>
                </div>

                <div className="mt-7 flex justify-center">
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1A1A1A] px-7 text-xs font-semibold text-white transition hover:bg-[#333]"
                  >
                    {t.logIn}
                  </Link>
                </div>
              </div>
            )}

            {/* FOOTER LINK */}
            <div className="mt-7 border-t border-[#1A1A1A]/10 pt-6 text-center text-sm text-[#1A1A1A]/50">
              {t.rememberPassword}{" "}
              <Link
                href="/login"
                className="font-semibold text-[#B8860B] transition hover:text-[#96700A]"
              >
                {t.logIn}
              </Link>
            </div>
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
