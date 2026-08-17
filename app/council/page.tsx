"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lang = "en" | "ar";

const content = {
  en: {
    brand: "HerAI Mashroo3",
    back: "← Back to profile",

    title: "The HerAI Council",
    subtitle:
      "A community of approved members who help review, improve, and govern the safety rules and guidance used by HerAI.",

    whatTitle: "What is the Council?",
    whatText:
      "The Council helps shape the rules that guide how HerAI supports users. Council members can review safety rules, propose improvements, and participate in the governance process.",

    responsibilityTitle: "What does the Council do?",
    responsibilities: [
      "Review safety rules and guidance.",
      "Create and improve rule proposals.",
      "Review rule changes before publication.",
      "Help maintain responsible and region-aware guidance.",
    ],

    membershipTitle: "Council membership",
    membershipText:
      "Council membership is separate from your normal HerAI account. You use your existing HerAI account to apply, and applications must be approved before Council tools become available.",

    apply: "Apply to join the Council",

    login: "Log in to apply",

    footer: "A DEVONEERS initiative",
  },

  ar: {
    brand: "HerAI Mashroo3",
    back: "← العودة للملف الشخصي",

    title: "مجلس HerAI",
    subtitle:
      "مجموعة من الأعضاء المعتمدين الذين يساعدون في مراجعة وتطوير وإدارة قواعد الأمان والإرشادات المستخدمة في HerAI.",

    whatTitle: "إيه هو المجلس؟",
    whatText:
      "المجلس بيساعد في تشكيل القواعد اللي بتوجّه طريقة دعم HerAI للمستخدمات. أعضاء المجلس يقدروا يراجعوا قواعد الأمان ويقترحوا تحسينات ويشاركوا في عملية الإدارة.",

    responsibilityTitle: "المجلس بيعمل إيه؟",
    responsibilities: [
      "مراجعة قواعد الأمان والإرشادات.",
      "إنشاء وتحسين مقترحات القواعد.",
      "مراجعة تغييرات القواعد قبل نشرها.",
      "المساعدة في الحفاظ على إرشادات مسؤولة ومناسبة لكل منطقة.",
    ],

    membershipTitle: "عضوية المجلس",
    membershipText:
      "عضوية المجلس منفصلة عن حساب HerAI العادي. بتستخدمي حسابك الحالي للتقديم، ولازم تتم الموافقة على الطلب قبل إتاحة أدوات المجلس.",

    apply: "قدمي للانضمام للمجلس",

    login: "سجلي الدخول للتقديم",

    footer: "A DEVONEERS initiative",
  },
} as const;

export default function CouncilPage() {
  const [lang, setLang] = useState<Lang>("en");

  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">
      <div className="mx-auto max-w-5xl">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">

          <Link
            href="/profile"
            className="text-lg font-semibold tracking-tight"
          >
            {t.brand}
          </Link>

          <button
            type="button"
            onClick={() =>
              setLang(lang === "en" ? "ar" : "en")
            }
            className="rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-xs font-medium transition hover:border-[#B8860B]/50"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>

        </div>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-3xl py-12 sm:py-16">

          {/* HEADER */}
          <div className="mb-10 text-center">

            <Link
              href="/profile"
              className="text-sm text-[#1A1A1A]/50 transition hover:text-[#1A1A1A]"
            >
              {t.back}
            </Link>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#1A1A1A]/60">
              {t.subtitle}
            </p>

          </div>

          {/* MAIN CONTENT */}
          <div className="space-y-6">

            {/* WHAT IS THE COUNCIL */}
            <section className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">

              <h2 className="text-2xl font-semibold">
                {t.whatTitle}
              </h2>

              <p className="mt-4 leading-7 text-[#1A1A1A]/60">
                {t.whatText}
              </p>

            </section>

            {/* RESPONSIBILITIES */}
            <section className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">

              <h2 className="text-2xl font-semibold">
                {t.responsibilityTitle}
              </h2>

              <div className="mt-6 space-y-4">

                {t.responsibilities.map(
                  (responsibility, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 rounded-2xl bg-[#FBF7EC] px-5 py-4"
                    >

                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B8860B] text-sm font-semibold text-white">
                        {index + 1}
                      </div>

                      <p className="pt-1 text-sm leading-6 text-[#1A1A1A]/70">
                        {responsibility}
                      </p>

                    </div>
                  )
                )}

              </div>

            </section>

            {/* MEMBERSHIP */}
            <section className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">

              <h2 className="text-2xl font-semibold">
                {t.membershipTitle}
              </h2>

              <p className="mt-4 leading-7 text-[#1A1A1A]/60">
                {t.membershipText}
              </p>

              {/* APPLY */}
              <div className="mt-8 rounded-2xl bg-[#FBF7EC] p-5">

                <Link
                  href="/council/register"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md transition hover:bg-[#96700A] sm:w-auto"
                >
                  {t.apply}
                </Link>

                <p className="mt-3 text-xs text-[#1A1A1A]/45">
                  {t.login}
                </p>

              </div>

            </section>

          </div>
        </div>

        {/* FOOTER */}
        <div className="pb-8 text-center text-xs text-[#1A1A1A]/35">
          {t.footer}
        </div>

      </div>
    </main>
  );
}