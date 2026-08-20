"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lang = "en" | "ar";

type CouncilStatus =
  | "pending"
  | "approved"
  | "rejected";

type CouncilMember = {
  id: string;
  user_id: string;
  status: CouncilStatus;
  created_at: string;
};

type ApplicationForm = {
  motivation: string;
  experience: string;
  contribution: string;
  availability: string;
  agreement: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

const content = {
  en: {
    brand: "HerAI Mashroo3",
    back: "← Back to Council",

    title: "Apply to join the Council",

    subtitle:
      "Council membership uses your existing HerAI account, but requires a separate application for Council membership.",

    whyTitle: "How Council membership works",

    points: [
      "You must already have a HerAI account.",
      "You complete a separate Council application.",
      "Your application starts as pending.",
      "An approved Council member reviews your application.",
      "Once approved, you can access Council tools.",
    ],

    accountTitle: "Your HerAI account",

    accountDescription:
      "Your existing HerAI account is used to identify you. Your Council application is reviewed separately from your normal HerAI account.",

    loggedInAs: "You are logged in as",

    applicationTitle: "Council application",

    applicationDescription:
      "Tell the Council why you would like to join and how you could contribute to HerAI's safety and governance.",

    motivationLabel:
      "Why do you want to join the Council?",

    motivationPlaceholder:
      "Tell us why you are interested in becoming a Council member.",

    experienceLabel:
      "What relevant experience or knowledge do you have?",

    experiencePlaceholder:
      "For example: community work, business experience, technology, safety, policy, education, or other relevant experience.",

    contributionLabel:
      "How would you contribute to the Council?",

    contributionPlaceholder:
      "Describe the areas where you think you could help the Council.",

    availabilityLabel:
      "How much time could you reasonably contribute?",

    availabilityPlaceholder:
      "For example: a few hours per month, several hours per week, or another realistic commitment.",

    agreementLabel:
      "I understand that Council membership is subject to review and approval, and that submitting this application does not guarantee membership.",

    apply: "Submit Council application",

    applying: "Submitting application...",

    loginRequired:
      "You need to log in to your HerAI account before applying.",

    login: "Log in",

    successTitle: "Application submitted",

    successDescription:
      "Your Council application has been submitted successfully and is now pending approval.",

    pendingNote:
      "Please wait for the Council review. You will only receive access to Council tools after approval.",

    approvedTitle:
      "Your application has been approved",

    approvedDescription:
      "You are now a Council member and can access the Council dashboard.",

    rejectedTitle:
      "Application not approved",

    rejectedDescription:
      "Your Council application was not approved. You can contact the Council for more information.",

    dashboard: "Go to Council dashboard",

    error:
      "Something went wrong. Please try again.",

    required:
      "Please complete all required fields before submitting.",

    backToCouncil: "Back to Council",
  },

  ar: {
    brand: "HerAI Mashroo3",
    back: "← الرجوع للمجلس",

    title: "التقديم للانضمام للمجلس",

    subtitle:
      "عضوية المجلس بتستخدم حساب HerAI الموجود بالفعل، لكن لازم يكون فيه طلب منفصل للانضمام للمجلس.",

    whyTitle: "عضوية المجلس بتشتغل إزاي؟",

    points: [
      "لازم يكون عندك حساب HerAI بالفعل.",
      "بتكملي طلب منفصل للانضمام للمجلس.",
      "الطلب بيبدأ بحالة قيد المراجعة.",
      "عضو معتمد من المجلس بيراجع الطلب.",
      "بعد الموافقة تقدري تستخدمي أدوات المجلس.",
    ],

    accountTitle: "حساب HerAI الخاص بيكي",

    accountDescription:
      "حساب HerAI الموجود بالفعل بيستخدم للتعرف عليكي. طلب المجلس بيتم مراجعته بشكل منفصل عن حساب HerAI العادي.",

    loggedInAs: "إنتِ مسجلة الدخول باسم",

    applicationTitle: "طلب الانضمام للمجلس",

    applicationDescription:
      "احكي للمجلس ليه حابة تنضمي وإزاي ممكن تساهمي في أمان وحوكمة HerAI.",

    motivationLabel:
      "ليه حابة تنضمي للمجلس؟",

    motivationPlaceholder:
      "اكتبي ليه مهتمة إنك تكوني عضوة في المجلس.",

    experienceLabel:
      "إيه الخبرة أو المعرفة المرتبطة اللي عندك؟",

    experiencePlaceholder:
      "مثلاً: العمل المجتمعي، الخبرة في الأعمال، التكنولوجيا، الأمان، السياسات، التعليم، أو أي خبرة مرتبطة.",

    contributionLabel:
      "إزاي ممكن تساهمي في المجلس؟",

    contributionPlaceholder:
      "وضحي المجالات اللي شايفة إنك تقدري تساعدي فيها المجلس.",

    availabilityLabel:
      "قد إيه من الوقت تقدري تساهمي بيه بشكل واقعي؟",

    availabilityPlaceholder:
      "مثلاً: كام ساعة في الشهر، كام ساعة في الأسبوع، أو أي التزام واقعي آخر.",

    agreementLabel:
      "أنا فاهمة إن عضوية المجلس بتخضع للمراجعة والموافقة، وإن إرسال الطلب لا يضمن الحصول على العضوية.",

    apply: "إرسال طلب الانضمام للمجلس",

    applying: "جاري إرسال الطلب...",

    loginRequired:
      "لازم تسجلي الدخول لحساب HerAI قبل التقديم.",

    login: "تسجيل الدخول",

    successTitle: "تم إرسال الطلب",

    successDescription:
      "تم إرسال طلب الانضمام للمجلس بنجاح، والطلب حاليًا في انتظار الموافقة.",

    pendingNote:
      "استني مراجعة المجلس. مش هيكون عندك وصول لأدوات المجلس إلا بعد الموافقة.",

    approvedTitle:
      "تمت الموافقة على طلبك",

    approvedDescription:
      "أصبحتِ الآن عضوة في المجلس ويمكنك فتح لوحة المجلس.",

    rejectedTitle:
      "لم تتم الموافقة على الطلب",

    rejectedDescription:
      "لم تتم الموافقة على طلب الانضمام للمجلس. يمكنك التواصل مع المجلس لمعرفة المزيد.",

    dashboard: "فتح لوحة المجلس",

    error:
      "حصلت مشكلة. حاولي مرة تانية.",

    required:
      "كملي كل البيانات المطلوبة قبل إرسال الطلب.",

    backToCouncil: "الرجوع للمجلس",
  },
} as const;

export default function CouncilRegisterPage() {
  const [lang, setLang] =
    useState<Lang>("en");

  const [loading, setLoading] =
    useState(false);

  const [member, setMember] =
    useState<CouncilMember | null>(null);

  const [error, setError] =
    useState("");

  const [token, setToken] =
    useState<string | null>(null);

  const [userName, setUserName] =
    useState("");

  const [userEmail, setUserEmail] =
    useState("");

  const [form, setForm] =
    useState<ApplicationForm>({
      motivation: "",
      experience: "",
      contribution: "",
      availability: "",
      agreement: false,
    });

  const t = content[lang];

  /*
   * Keep the language direction synchronized
   * with the selected language.
   */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  /*
   * Load the same authentication information
   * used by the HerAI profile page.
   */
  useEffect(() => {
    const storedToken =
      localStorage.getItem(
        "herai_access_token"
      );

    setToken(storedToken);

    const storedUser =
      localStorage.getItem("herai_user");

    if (!storedUser) {
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser);

      const firstName =
        parsedUser.firstName ||
        parsedUser.first_name ||
        "";

      const lastName =
        parsedUser.lastName ||
        parsedUser.last_name ||
        "";

      const fullName =
        `${firstName} ${lastName}`.trim();

      setUserName(
        fullName ||
          parsedUser.email ||
          "HerAI User"
      );

      setUserEmail(
        parsedUser.email || ""
      );
    } catch {
      localStorage.removeItem(
        "herai_user"
      );
    }
  }, []);

  function updateField(
    field: keyof ApplicationForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getAccessToken() {
    return localStorage.getItem(
      "herai_access_token"
    );
  }

  async function handleRegister() {
    setError("");
    setMember(null);

    const accessToken =
      getAccessToken();

    if (!accessToken) {
      setError(t.loginRequired);
      return;
    }

    /*
     * Validate the Council-specific
     * application before contacting
     * the backend.
     */
    if (
      !form.motivation.trim() ||
      !form.experience.trim() ||
      !form.contribution.trim() ||
      !form.availability.trim() ||
      !form.agreement
    ) {
      setError(t.required);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/council/register`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",
          },

          /*
           * Council-specific application
           * information.
           */
          body: JSON.stringify({
            motivation:
              form.motivation.trim(),

            experience:
              form.experience.trim(),

            contribution:
              form.contribution.trim(),

            availability:
              form.availability.trim(),

            agreement:
              form.agreement,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || t.error
        );
      }

      /*
       * Store Council identifiers when
       * returned by the backend.
       */
      if (data?.user_id) {
        localStorage.setItem(
          "council_user_id",
          data.user_id
        );
      }

      if (data?.id) {
        localStorage.setItem(
          "council_member_id",
          data.id
        );
      }

      setMember(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.error
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

          <Link
            href="/council"
            className="text-lg font-semibold tracking-tight"
          >
            {t.brand}
          </Link>

          <button
            type="button"
            onClick={() =>
              setLang(
                lang === "en"
                  ? "ar"
                  : "en"
              )
            }
            className="rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-xs font-medium transition hover:border-[#B8860B]/50"
          >
            {lang === "en"
              ? "عربي"
              : "EN"}
          </button>

        </div>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-2xl py-12 sm:py-16">

          {/* HEADER */}
          <div className="mb-8 text-center">

            <Link
              href="/council"
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

          {/* MAIN CARD */}
          <div className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">

            {/* HOW IT WORKS */}
            <div className="rounded-2xl bg-[#FBF7EC] px-5 py-5">

              <h2 className="font-semibold">
                {t.whyTitle}
              </h2>

              <ul className="mt-4 space-y-3">
                {t.points.map(
                  (point, index) => (
                    <li
                      key={index}
                      className="flex gap-3 text-sm leading-6 text-[#1A1A1A]/65"
                    >
                      <span className="font-semibold text-[#B8860B]">
                        {index + 1}.
                      </span>

                      <span>
                        {point}
                      </span>
                    </li>
                  )
                )}
              </ul>

            </div>

            {/* ACCOUNT SECTION */}
            <div className="mt-8">

              <h2 className="text-xl font-semibold">
                {t.accountTitle}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/60">
                {t.accountDescription}
              </p>

            </div>

            {/* LOGGED IN */}
            {token && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">

                <p className="text-xs font-medium uppercase tracking-wide text-green-700/60">
                  {t.loggedInAs}
                </p>

                <p className="mt-1 text-sm font-semibold text-green-800">
                  {userName || "HerAI User"}
                </p>

                {userEmail && (
                  <p className="mt-1 text-xs text-green-700/70">
                    {userEmail}
                  </p>
                )}

              </div>
            )}

            {/* NOT LOGGED IN */}
            {!token && (
              <div className="mt-7 rounded-2xl border border-[#B8860B]/20 bg-[#B8860B]/5 px-5 py-5">

                <p className="text-sm leading-6 text-[#1A1A1A]/65">
                  {t.loginRequired}
                </p>

                <Link
                  href="/login"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A]"
                >
                  {t.login}
                </Link>

              </div>
            )}

            {/* APPLICATION FORM */}
            {token && !member && (
              <div className="mt-8">

                <div className="border-t border-[#1A1A1A]/10 pt-8">

                  <h2 className="text-2xl font-semibold">
                    {t.applicationTitle}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/60">
                    {t.applicationDescription}
                  </p>

                </div>

                {/* MOTIVATION */}
                <div className="mt-7">

                  <label
                    htmlFor="motivation"
                    className="text-sm font-semibold"
                  >
                    {t.motivationLabel}
                  </label>

                  <textarea
                    id="motivation"
                    value={form.motivation}
                    onChange={(event) =>
                      updateField(
                        "motivation",
                        event.target.value
                      )
                    }
                    placeholder={
                      t.motivationPlaceholder
                    }
                    rows={5}
                    className="mt-2 w-full resize-y rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />

                </div>

                {/* EXPERIENCE */}
                <div className="mt-6">

                  <label
                    htmlFor="experience"
                    className="text-sm font-semibold"
                  >
                    {t.experienceLabel}
                  </label>

                  <textarea
                    id="experience"
                    value={form.experience}
                    onChange={(event) =>
                      updateField(
                        "experience",
                        event.target.value
                      )
                    }
                    placeholder={
                      t.experiencePlaceholder
                    }
                    rows={5}
                    className="mt-2 w-full resize-y rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />

                </div>

                {/* CONTRIBUTION */}
                <div className="mt-6">

                  <label
                    htmlFor="contribution"
                    className="text-sm font-semibold"
                  >
                    {t.contributionLabel}
                  </label>

                  <textarea
                    id="contribution"
                    value={form.contribution}
                    onChange={(event) =>
                      updateField(
                        "contribution",
                        event.target.value
                      )
                    }
                    placeholder={
                      t.contributionPlaceholder
                    }
                    rows={5}
                    className="mt-2 w-full resize-y rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />

                </div>

                {/* AVAILABILITY */}
                <div className="mt-6">

                  <label
                    htmlFor="availability"
                    className="text-sm font-semibold"
                  >
                    {t.availabilityLabel}
                  </label>

                  <textarea
                    id="availability"
                    value={form.availability}
                    onChange={(event) =>
                      updateField(
                        "availability",
                        event.target.value
                      )
                    }
                    placeholder={
                      t.availabilityPlaceholder
                    }
                    rows={3}
                    className="mt-2 w-full resize-y rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#1A1A1A]/30 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                  />

                </div>

                {/* AGREEMENT */}
                <div className="mt-6 rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/50 p-4">

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={form.agreement}
                      onChange={(event) =>
                        updateField(
                          "agreement",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[#B8860B]"
                    />

                    <span className="text-sm leading-6 text-[#1A1A1A]/65">
                      {t.agreementLabel}
                    </span>

                  </label>

                </div>

              </div>
            )}

            {/* ERROR */}
            {error && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            {token && !member && (
              <div className="mt-7">

                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? t.applying
                    : t.apply}
                </button>

              </div>
            )}

            {/* APPLICATION RESULT */}
            {member && (
              <div
                role="status"
                className={`mt-7 rounded-2xl border px-5 py-5 ${
                  member.status === "approved"
                    ? "border-green-200 bg-green-50"
                    : member.status === "rejected"
                    ? "border-red-200 bg-red-50"
                    : "border-[#B8860B]/20 bg-[#B8860B]/5"
                }`}
              >

                {member.status ===
                  "approved" && (
                  <>
                    <h3 className="font-semibold text-green-800">
                      {t.approvedTitle}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-green-700/80">
                      {t.approvedDescription}
                    </p>

                    <Link
                      href="/council/dashboard"
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A]"
                    >
                      {t.dashboard}
                    </Link>
                  </>
                )}

                {member.status ===
                  "pending" && (
                  <>
                    <h3 className="font-semibold text-[#7A5A00]">
                      {t.successTitle}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#7A5A00]/80">
                      {t.successDescription}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-[#7A5A00]/70">
                      {t.pendingNote}
                    </p>
                  </>
                )}

                {member.status ===
                  "rejected" && (
                  <>
                    <h3 className="font-semibold text-red-800">
                      {t.rejectedTitle}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-red-700/80">
                      {t.rejectedDescription}
                    </p>
                  </>
                )}

              </div>
            )}

            {/* COUNCIL-ONLY NAVIGATION */}
            <div className="mt-7 border-t border-[#1A1A1A]/10 pt-6 text-center">

              <Link
                href="/council"
                className="text-sm font-medium text-[#1A1A1A]/50 transition hover:text-[#1A1A1A]"
              >
                {t.backToCouncil}
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