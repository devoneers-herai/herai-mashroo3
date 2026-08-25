"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Lang = "en" | "ar";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const content = {
  en: {
    brand: "HerAI Mashroo3",
    back: "← Back to home",
    title: "Create your account",
    subtitle:
      "Join HerAI and get practical business guidance in your language.",
    fields: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      password: "Password",
      age: "Age",
      domain: "Business domain",
      country: "Country",
      city: "City",
      phoneNumber: "Phone number",
    },
    placeholders: {
      firstName: "Enter your first name",
      lastName: "Enter your last name",
      email: "you@example.com",
      password: "Create a password",
      age: "Your age",
      domain: "e.g. agriculture, food, clothing",
      city: "e.g. Cairo",
      phoneNumber: "+201234567890",
    },
    countries: {
      Egypt: "Egypt",
      Lebanon: "Lebanon",
    },
    button: "Create account",
    creating: "Creating account...",
    already: "Already have an account?",
    login: "Log in",
    required: "Please fill in all required fields.",
    success: "Account created successfully!",
    genericError: "Something went wrong. Please try again.",
    passwordHint: "Use at least 6 characters.",
  },

  ar: {
    brand: "HerAI Mashroo3",
    back: "← العودة للرئيسية",
    title: "اعملي حسابك",
    subtitle:
      "انضمي إلى HerAI واحصلي على إرشاد عملي لشغلك بلغتك.",
    fields: {
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      age: "السن",
      domain: "مجال الشغل",
      country: "الدولة",
      city: "المدينة",
      phoneNumber: "رقم الموبايل",
    },
    placeholders: {
      firstName: "اكتبي اسمك الأول",
      lastName: "اكتبي اسم العائلة",
      email: "you@example.com",
      password: "اعملي كلمة مرور",
      age: "السن",
      domain: "مثال: زراعة، أكل، ملابس",
      city: "مثال: القاهرة",
      phoneNumber: "+201234567890",
    },
    countries: {
      Egypt: "مصر",
      Lebanon: "لبنان",
    },
    button: "إنشاء الحساب",
    creating: "جاري إنشاء الحساب...",
    already: "عندك حساب بالفعل؟",
    login: "تسجيل الدخول",
    required: "من فضلك املئي كل البيانات المطلوبة.",
    success: "تم إنشاء الحساب بنجاح!",
    genericError: "حصلت مشكلة. حاولي مرة تانية.",
    passwordHint: "استخدمي 6 أحرف على الأقل.",
  },
} as const;

export default function RegisterPage() {
  const [lang, setLang] = useState<Lang>("en");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    age: "",
    domain: "",
    country: "Egypt",
    city: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.email ||
      !form.password ||
      !form.firstName ||
      !form.lastName ||
      !form.phoneNumber
    ) {
      setError(t.required);
      return;
    }

    if (form.password.length < 6) {
      setError(t.passwordHint);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            age: form.age ? Number(form.age) : undefined,
            domain: form.domain || undefined,
            country: form.country,
            city: form.city || undefined,
            phoneNumber: form.phoneNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || t.genericError
        );
      }

      setSuccess(t.success);

      /*
       * For now, we stay on the registration page after
       * successful registration.
       *
       * Later, when the login/session flow is connected
       * to the frontend, we can redirect the user to
       * /chat or another authenticated page here.
       */

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        age: "",
        domain: "",
        country: "Egypt",
        city: "",
        phoneNumber: "",
      });
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
    <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight cursor-default select-none">
            {t.brand}
          </span>

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
              {/* FIRST + LAST NAME */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {t.fields.firstName}
                  </label>

                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      updateField(
                        "firstName",
                        e.target.value
                      )
                    }
                    placeholder={
                      t.placeholders.firstName
                    }
                    required
                    className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {t.fields.lastName}
                  </label>

                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      updateField(
                        "lastName",
                        e.target.value
                      )
                    }
                    placeholder={
                      t.placeholders.lastName
                    }
                    required
                    className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />
                </div>
              </div>

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
                  placeholder={
                    t.placeholders.password
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                />

                <p className="mt-2 text-xs text-[#1A1A1A]/40">
                  {t.passwordHint}
                </p>
              </div>

              {/* AGE + COUNTRY */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {t.fields.age}
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={(e) =>
                      updateField(
                        "age",
                        e.target.value
                      )
                    }
                    placeholder={t.placeholders.age}
                    className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {t.fields.country}
                  </label>

                  <select
                    value={form.country}
                    onChange={(e) =>
                      updateField(
                        "country",
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  >
                    <option value="Egypt">
                      🇪🇬 {t.countries.Egypt}
                    </option>

                    <option value="Lebanon">
                      🇱🇧 {t.countries.Lebanon}
                    </option>
                  </select>
                </div>
              </div>

              {/* DOMAIN */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {t.fields.domain}
                </label>

                <input
                  type="text"
                  value={form.domain}
                  onChange={(e) =>
                    updateField(
                      "domain",
                      e.target.value
                    )
                  }
                  placeholder={
                    t.placeholders.domain
                  }
                  className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* CITY */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {t.fields.city}
                </label>

                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    updateField(
                      "city",
                      e.target.value
                    )
                  }
                  placeholder={t.placeholders.city}
                  className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-[#FBF7EC]/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {t.fields.phoneNumber}
                </label>

                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    updateField(
                      "phoneNumber",
                      e.target.value
                    )
                  }
                  placeholder={
                    t.placeholders.phoneNumber
                  }
                  required
                  autoComplete="tel"
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

              {/* SUCCESS */}
              {success && (
                <div
                  role="status"
                  className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {success}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t.creating : t.button}
              </button>
            </form>

            {/* LOGIN */}
            <div className="mt-7 border-t border-[#1A1A1A]/10 pt-6 text-center text-sm text-[#1A1A1A]/50">
             {t.already}{" "}
<Link
  href="/login"
  className="font-semibold text-[#B8860B] transition hover:text-[#96700A]"
>
  {t.login}
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