"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Lang = "en" | "ar";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const content = {
  en: {
    brand: "HerAI Mashroo3",
    back: "← Back to home",
    title: "Welcome back",
    subtitle:
      "Log in to your HerAI account and continue getting practical business guidance.",

    fields: {
      email: "Email",
      password: "Password",
    },

    placeholders: {
      email: "you@example.com",
      password: "Enter your password",
    },

    button: "Log in",
    loggingIn: "Logging in...",
    noAccount: "Don't have an account?",
    register: "Create an account",

    required: "Please enter your email and password.",
    genericError: "Something went wrong. Please try again.",
  },

  ar: {
    brand: "HerAI Mashroo3",
    back: "العودة للرئيسية ←",
    title: "أهلًا بيكي تاني",
    subtitle:
      "سجّلي الدخول لحساب HerAI بتاعك وكمّلي الحصول على إرشاد عملي لشغلك.",

    fields: {
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
    },

    placeholders: {
      email: "you@example.com",
      password: "اكتبي كلمة المرور",
    },

    button: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    noAccount: "لسه معندكيش حساب؟",
    register: "اعملي حساب",

    required: "من فضلك اكتبي البريد الإلكتروني وكلمة المرور.",
    genericError: "حصلت مشكلة. حاولي مرة تانية.",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("en");
  const [languageReady, setLanguageReady] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = content[lang];

  /*
   * Load the language that was previously selected.
   */
  useEffect(() => {
    const storedLanguage = localStorage.getItem("herai_language");

    if (storedLanguage === "ar" || storedLanguage === "en") {
      setLang(storedLanguage);
    }

    setLanguageReady(true);
  }, []);

  /*
   * Keep the language preference, HTML language, and direction
   * synchronized whenever the user changes the language.
   */
  useEffect(() => {
    if (!languageReady) return;

    localStorage.setItem("herai_language", lang);

    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === "ar" ? "rtl" : "ltr";
  }, [lang, languageReady]);

  function toggleLanguage() {
    setLang((currentLang) =>
      currentLang === "en" ? "ar" : "en"
    );
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!form.email || !form.password) {
      setError(t.required);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || t.genericError
        );
      }

      /*
       * IMPORTANT:
       * Save the exact language used during login.
       * The Profile page reads this value.
       */
      localStorage.setItem(
        "herai_language",
        lang
      );

      document.documentElement.lang = lang;
      document.documentElement.dir =
        lang === "ar" ? "rtl" : "ltr";

      /*
       * Store the authentication session.
       */
      if (data?.session?.access_token) {
        localStorage.setItem(
          "herai_access_token",
          data.session.access_token
        );
      }

      if (data?.session?.refresh_token) {
        localStorage.setItem(
          "herai_refresh_token",
          data.session.refresh_token
        );
      }

      /*
       * Store the logged-in user's information.
       */
      if (data?.user) {
        localStorage.setItem(
          "herai_user",
          JSON.stringify(data.user)
        );
      }

      /*
       * Login successful.
       * The selected language has already been saved,
       * so Profile can display in the same language.
       */
      router.push("/profile");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.genericError
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight"
          >
            {t.brand}
          </Link>

          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-xs font-medium transition hover:border-[#B8860B]/50"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-2xl py-12 sm:py-16">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="text-sm text-[#1A1A1A]/50 transition hover:text-[#1A1A1A]"
            >
              {t.back}
            </Link>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.title}
            </h1>

            <p className="mx-auto mt-4 max-w-lg leading-7 text-[#1A1A1A]/60">
              {t.subtitle}
            </p>
          </div>

          {/* FORM CARD */}
          <div className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {t.fields.email}
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder={t.placeholders.email}
                  required
                  autoComplete="email"
                  dir="ltr"
                  className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {t.fields.password}
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    updateField(
                      "password",
                      e.target.value
                    )
                  }
                  placeholder={t.placeholders.password}
                  required
                  autoComplete="current-password"
                  dir="ltr"
                  className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? t.loggingIn
                  : t.button}
              </button>
            </form>

            {/* REGISTER */}
            <div className="mt-7 border-t border-[#1A1A1A]/10 pt-6 text-center text-sm text-[#1A1A1A]/50">
              {t.noAccount}{" "}

              <Link
                href="/register"
                className="font-semibold text-[#B8860B] transition hover:text-[#96700A]"
              >
                {t.register}
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