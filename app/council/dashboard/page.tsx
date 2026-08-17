"use client";

import { useCallback, useEffect, useState } from "react";
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
  approved_at?: string | null;
};

type CouncilApplication = {
  id: string;
  user_id: string;
  status: CouncilStatus;
  created_at: string;
  approved_at?: string | null;
  motivation?: string | null;
  experience?: string | null;
  contribution?: string | null;
  availability?: string | null;
  agreement?: boolean;
};

type CouncilRuleStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "active";

type CouncilRule = {
  id?: string;
  rule_id?: string;
  ruleset_id?: string;
  version?: number;
  region_code?: string;
  domain_scope?: string;
  category?: string | null;
  severity?: string;
  decision_type?: string;
  trigger_description?: string;
  adjustment_instruction?: string;
  fallback_message?: string;
  status: CouncilRuleStatus;
  created_at?: string;
  created_by?: string | null;
};

type CouncilDashboardResponse = {
  applications?: CouncilApplication[];
  members?: CouncilMember[];
  rules?: CouncilRule[];
  rulesets?: unknown[];
  stats?: {
    pendingApplications?: number;
    approvedMembers?: number;
    pendingRules?: number;
    draftRules?: number;
    approvedRules?: number;
    activeRuleSets?: number;
    draftRuleSets?: number;
  };
};

type ApiError = {
  error?: string;
  message?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const content = {
  en: {
    brand: "HerAI Mashroo3",
    back: "← Back to profile",
    title: "Council dashboard",
    subtitle:
      "Review Council applications, manage safety rules, and help govern the guidance used by HerAI.",
    loading: "Checking Council access...",
    refreshing: "Refreshing...",
    accessDeniedTitle: "Council access required",
    accessDenied:
      "Your HerAI account does not have approved Council membership. Only approved Council members can access this dashboard.",
    backToCouncil: "Back to profile",
    overview: "Council overview",
    memberStatus: "Membership status",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    applications: "Member applications",
    applicationsDescription:
      "Review people who have applied to become Council members.",
    noApplications: "There are no pending Council applications.",
    approve: "Approve",
    reject: "Reject",
    motivationLabel: "Motivation",
    experienceLabel: "Experience",
    contributionLabel: "Contribution",
    availabilityLabel: "Availability",
    agreementLabel: "Agreement",
    applicantId: "Applicant ID",
    rules: "Safety rules",
    rulesDescription:
      "Review active rules and create new rule proposals for HerAI.",
    createRule: "Create new rule",
    noRules: "No rules have been created yet.",
    active: "Active",
    draft: "Draft",
    rulePending: "Pending review",
    ruleApproved: "Approved",
    ruleRejected: "Rejected",
    createRuleTitle: "Create a Council rule",
    ruleId: "Rule ID",
    ruleIdPlaceholder: "For example: business-safety-001",
    rulesetId: "RuleSet ID",
    rulesetIdPlaceholder: "The ID of the draft RuleSet",
    version: "Version",
    regionCode: "Region code",
    regionCodePlaceholder: "For example: EG",
    domainScope: "Domain scope",
    domainScopePlaceholder: "For example: business",
    category: "Category",
    categoryPlaceholder: "For example: safety",
    severity: "Severity",
    decisionType: "Decision type",
    triggerDescription: "Trigger description",
    triggerDescriptionPlaceholder:
      "Describe when this rule should trigger.",
    adjustmentInstruction: "Adjustment instruction",
    adjustmentInstructionPlaceholder:
      "Describe how HerAI should adjust its response.",
    fallbackMessage: "Fallback message",
    fallbackMessagePlaceholder:
      "Message HerAI should use when the rule blocks or limits a request.",
    cancel: "Cancel",
    create: "Create rule",
    creating: "Creating rule...",
    error: "Something went wrong. Please try again.",
    unauthorized: "You are not authorized to perform this action.",
    networkError:
      "Unable to connect to the HerAI server. Please check that the backend is running.",
    applicationApproved: "Application approved.",
    applicationRejected: "Application rejected.",
    ruleCreated: "Rule proposal created.",
    logout: "Log out",
    refresh: "Refresh",
    created: "Created",
    yes: "Yes",
    no: "No",
  },

  ar: {
    brand: "HerAI Mashroo3",
    back: "← الرجوع للملف الشخصي",
    title: "لوحة تحكم المجلس",
    subtitle:
      "راجعي طلبات الانضمام، وأديري قواعد الأمان، وساهمي في حوكمة الإرشادات المستخدمة في HerAI.",
    loading: "جاري التحقق من صلاحيات المجلس...",
    refreshing: "جاري التحديث...",
    accessDeniedTitle: "الوصول للمجلس مطلوب",
    accessDenied:
      "حساب HerAI الخاص بيكي مش عنده عضوية مجلس معتمدة. أعضاء المجلس المعتمدين فقط يقدروا يدخلوا لوحة التحكم.",
    backToCouncil: "الرجوع للملف الشخصي",
    overview: "نظرة عامة على المجلس",
    memberStatus: "حالة العضوية",
    approved: "معتمدة",
    pending: "قيد المراجعة",
    rejected: "مرفوضة",
    applications: "طلبات العضوية",
    applicationsDescription:
      "راجعي الأشخاص اللي قدموا للانضمام للمجلس.",
    noApplications: "مفيش طلبات عضوية معلقة حاليًا.",
    approve: "موافقة",
    reject: "رفض",
    motivationLabel: "الدافع",
    experienceLabel: "الخبرة",
    contributionLabel: "المساهمة",
    availabilityLabel: "التفرغ",
    agreementLabel: "الموافقة",
    applicantId: "معرف المتقدم",
    rules: "قواعد الأمان",
    rulesDescription:
      "راجعي القواعد الحالية وأنشئي مقترحات جديدة لقواعد HerAI.",
    createRule: "إنشاء قاعدة جديدة",
    noRules: "مفيش قواعد تم إنشاؤها حتى الآن.",
    active: "نشطة",
    draft: "مسودة",
    rulePending: "قيد المراجعة",
    ruleApproved: "تمت الموافقة",
    ruleRejected: "تم الرفض",
    createRuleTitle: "إنشاء قاعدة للمجلس",
    ruleId: "معرف القاعدة",
    ruleIdPlaceholder: "مثلاً: business-safety-001",
    rulesetId: "معرف مجموعة القواعد",
    rulesetIdPlaceholder: "معرف RuleSet المسودة",
    version: "الإصدار",
    regionCode: "كود المنطقة",
    regionCodePlaceholder: "مثلاً: EG",
    domainScope: "نطاق المجال",
    domainScopePlaceholder: "مثلاً: business",
    category: "التصنيف",
    categoryPlaceholder: "مثلاً: safety",
    severity: "درجة الخطورة",
    decisionType: "نوع القرار",
    triggerDescription: "وصف المحفز",
    triggerDescriptionPlaceholder:
      "اكتبي إمتى القاعدة دي تشتغل.",
    adjustmentInstruction: "تعليمات التعديل",
    adjustmentInstructionPlaceholder:
      "اكتبي إزاي HerAI تعدل الرد.",
    fallbackMessage: "رسالة بديلة",
    fallbackMessagePlaceholder:
      "الرسالة اللي HerAI تستخدمها لما القاعدة تمنع أو تحد من الطلب.",
    cancel: "إلغاء",
    create: "إنشاء القاعدة",
    creating: "جاري إنشاء القاعدة...",
    error: "حصلت مشكلة. حاولي مرة تانية.",
    unauthorized: "مش مسموح ليكي بتنفيذ العملية دي.",
    networkError:
      "مش قادرين نتصل بسيرفر HerAI. اتأكدي إن الـ backend شغال.",
    applicationApproved: "تمت الموافقة على الطلب.",
    applicationRejected: "تم رفض الطلب.",
    ruleCreated: "تم إنشاء مقترح القاعدة.",
    logout: "تسجيل الخروج",
    refresh: "تحديث",
    created: "تم الإنشاء",
    yes: "نعم",
    no: "لا",
  },
} as const;

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (!isObject(data)) {
    return fallback;
  }

  const error = data.error;
  const message = data.message;

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error;
  }

  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message;
  }

  return fallback;
}

/**
 * Parse the backend Council dashboard response.
 *
 * Expected backend response:
 *
 * {
 *   applications: [],
 *   members: [],
 *   rules: [],
 *   rulesets: [],
 *   stats: {}
 * }
 *
 * The parser also supports:
 *
 * {
 *   data: {
 *     applications: [],
 *     ...
 *   }
 * }
 */
function getDashboardFromResponse(
  data: unknown
): CouncilDashboardResponse {
  if (!isObject(data)) {
    return {
      applications: [],
      members: [],
      rules: [],
      rulesets: [],
    };
  }

  if (isObject(data.data)) {
    return getDashboardFromResponse(data.data);
  }

  return {
    applications: Array.isArray(data.applications)
      ? (data.applications as CouncilApplication[])
      : Array.isArray(data.pendingApplications)
        ? (data.pendingApplications as CouncilApplication[])
        : [],

    members: Array.isArray(data.members)
      ? (data.members as CouncilMember[])
      : [],

    rules: Array.isArray(data.rules)
      ? (data.rules as CouncilRule[])
      : [],

    rulesets: Array.isArray(data.rulesets)
      ? data.rulesets
      : [],

    stats: isObject(data.stats)
      ? (data.stats as CouncilDashboardResponse["stats"])
      : undefined,
  };
}

function getMemberFromResponse(
  data: unknown
): CouncilMember | null {
  if (!isObject(data)) {
    return null;
  }

  if (isObject(data.member)) {
    return data.member as unknown as CouncilMember;
  }

  if (isObject(data.data)) {
    return getMemberFromResponse(data.data);
  }

  if (
    typeof data.id === "string" &&
    typeof data.user_id === "string" &&
    typeof data.status === "string"
  ) {
    return data as unknown as CouncilMember;
  }

  return null;
}

function getRuleFromResponse(
  data: unknown
): CouncilRule | null {
  if (!isObject(data)) {
    return null;
  }

  if (isObject(data.rule)) {
    return data.rule as unknown as CouncilRule;
  }

  if (isObject(data.data)) {
    return getRuleFromResponse(data.data);
  }

  if (
    typeof data.rule_id === "string" ||
    typeof data.id === "string"
  ) {
    return data as unknown as CouncilRule;
  }

  return null;
}

export default function CouncilDashboardPage() {
  const [lang, setLang] =
    useState<Lang>("en");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [authorized, setAuthorized] =
    useState(false);

  const [member, setMember] =
    useState<CouncilMember | null>(null);

  const [applications, setApplications] =
    useState<CouncilApplication[]>([]);

  const [rules, setRules] =
    useState<CouncilRule[]>([]);

  const [pendingCount, setPendingCount] =
    useState(0);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [
    showCreateRule,
    setShowCreateRule,
  ] = useState(false);

  const [ruleId, setRuleId] =
    useState("");

  const [rulesetId, setRulesetId] =
    useState("");

  const [version, setVersion] =
    useState(1);

  const [regionCode, setRegionCode] =
    useState("");

  const [domainScope, setDomainScope] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [severity, setSeverity] =
    useState("medium");

  const [decisionType, setDecisionType] =
    useState("adjust");

  const [
    triggerDescription,
    setTriggerDescription,
  ] = useState("");

  const [
    adjustmentInstruction,
    setAdjustmentInstruction,
  ] = useState("");

  const [
    fallbackMessage,
    setFallbackMessage,
  ] = useState("");

  const [
    creatingRule,
    setCreatingRule,
  ] = useState(false);

  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === "ar" ? "rtl" : "ltr";

    return () => {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    };
  }, [lang]);

  /**
   * Get the Supabase access token saved by the
   * authentication flow.
   */
  const getAccessToken =
    useCallback((): string | null => {
      if (
        typeof window === "undefined"
      ) {
        return null;
      }

      return localStorage.getItem(
        "herai_access_token"
      );
    }, []);

  /**
   * Log the user out and remove all locally
   * stored authentication information.
   */
  const handleLogout =
    useCallback(() => {
      localStorage.removeItem(
        "herai_user"
      );

      localStorage.removeItem(
        "herai_session"
      );

      localStorage.removeItem(
        "herai_access_token"
      );

      localStorage.removeItem(
        "herai_refresh_token"
      );

      window.location.href = "/login";
    }, []);

  /**
   * CENTRAL FRONTEND API FETCH FUNCTION
   *
   * Every protected Council request goes through
   * this function.
   *
   * It:
   *
   * 1. Gets the access token.
   * 2. Adds Authorization: Bearer <token>.
   * 3. Sends the request to the backend.
   * 4. Parses JSON responses.
   * 5. Converts 401/403 into an authorization error.
   */
  const apiRequest = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ): Promise<unknown> => {
      const token = getAccessToken();

      if (!token) {
        throw new Error(
          t.unauthorized
        );
      }

      let response: Response;

      try {
        response = await fetch(
          `${API_URL}${endpoint}`,
          {
            ...options,

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              ...(options.headers || {}),

              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );
      } catch {
        throw new Error(
          t.networkError
        );
      }

      let data: unknown = null;

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        try {
          const text =
            await response.text();

          if (text) {
            data = {
              message: text,
            };
          }
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            t.unauthorized
          );
        }

        throw new Error(
          getErrorMessage(
            data,
            t.error
          )
        );
      }

      return data;
    },
    [
      getAccessToken,
      t.error,
      t.networkError,
      t.unauthorized,
    ]
  );

  /**
   * LOAD THE COUNCIL DASHBOARD
   *
   * Flow:
   *
   * GET /api/council/me
   *       ↓
   * check status === approved
   *       ↓
   * GET /api/council/dashboard
   *       ↓
   * getDashboardFromResponse()
   */
  const loadDashboard =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const token =
            getAccessToken();

          if (!token) {
            setAuthorized(false);
            setMember(null);
            setApplications([]);
            setRules([]);
            setPendingCount(0);
            return;
          }

          /*
           * First verify that the authenticated
           * user is an approved Council member.
           */
          const memberResponse =
            await apiRequest(
              "/api/council/me"
            );

          const memberData =
            getMemberFromResponse(
              memberResponse
            );

          if (
            !memberData ||
            memberData.status !==
              "approved"
          ) {
            setAuthorized(false);
            setMember(null);
            setApplications([]);
            setRules([]);
            setPendingCount(0);
            return;
          }

          setMember(memberData);
          setAuthorized(true);

          /*
           * Now fetch the actual dashboard data.
           */
          const dashboardResponse =
            await apiRequest(
              "/api/council/dashboard"
            );

          /*
           * Parse the backend response.
           */
          const dashboard =
            getDashboardFromResponse(
              dashboardResponse
            );

          const nextApplications =
            dashboard.applications || [];

          const nextRules =
            dashboard.rules || [];

          setApplications(
            nextApplications
          );

          setRules(nextRules);

          setPendingCount(
            dashboard.stats
              ?.pendingApplications ??
              nextApplications.length
          );
        } catch (err) {
          if (
            err instanceof Error &&
            err.message ===
              t.unauthorized
          ) {
            setAuthorized(false);
            setMember(null);
            setApplications([]);
            setRules([]);
            setPendingCount(0);
            return;
          }

          setError(
            err instanceof Error
              ? err.message
              : t.error
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        apiRequest,
        getAccessToken,
        t.error,
        t.unauthorized,
      ]
    );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function updateApplication(
    application: CouncilApplication,
    status:
      | "approved"
      | "rejected"
  ) {
    if (!application.user_id) {
      setError(
        "Application does not contain a user_id."
      );
      return;
    }

    setActionLoading(
      application.id
    );

    setError("");
    setSuccess("");

    try {
      const endpoint =
        status === "approved"
          ? `/api/council/members/${encodeURIComponent(
              application.user_id
            )}/approve`
          : `/api/council/members/${encodeURIComponent(
              application.user_id
            )}/reject`;

      await apiRequest(
        endpoint,
        {
          method: "POST",
        }
      );

      setApplications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              application.id
          )
      );

      setPendingCount(
        (current) =>
          Math.max(
            0,
            current - 1
          )
      );

      setSuccess(
        status === "approved"
          ? t.applicationApproved
          : t.applicationRejected
      );

      await loadDashboard(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          t.unauthorized
      ) {
        setAuthorized(false);
        setMember(null);
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : t.error
      );
    } finally {
      setActionLoading(null);
    }
  }

  function resetRuleForm() {
    setRuleId("");
    setRulesetId("");
    setVersion(1);
    setRegionCode("");
    setDomainScope("");
    setCategory("");
    setSeverity("medium");
    setDecisionType("adjust");
    setTriggerDescription("");
    setAdjustmentInstruction("");
    setFallbackMessage("");
  }

  async function handleCreateRule() {
    setError("");
    setSuccess("");

    const payload = {
      rule_id: ruleId.trim(),
      ruleset_id: rulesetId.trim(),
      version,
      region_code: regionCode.trim(),
      domain_scope: domainScope.trim(),
      category: category.trim(),
      severity,
      decision_type: decisionType,
      trigger_description:
        triggerDescription.trim(),
      adjustment_instruction:
        adjustmentInstruction.trim(),
      fallback_message:
        fallbackMessage.trim(),
    };

    if (
      !payload.rule_id ||
      !payload.ruleset_id ||
      !payload.region_code ||
      !payload.domain_scope ||
      !payload.category ||
      !payload.trigger_description ||
      !payload.adjustment_instruction ||
      !payload.fallback_message
    ) {
      setError(t.error);
      return;
    }

    if (payload.version < 1) {
      setError(t.error);
      return;
    }

    if (
      decisionType === "block" &&
      severity === "low"
    ) {
      setError(
        "A block rule cannot use low severity."
      );
      return;
    }

    setCreatingRule(true);

    try {
      const response =
        await apiRequest(
          "/api/council/rules",
          {
            method: "POST",
            body:
              JSON.stringify(payload),
          }
        );

      const createdRule =
        getRuleFromResponse(
          response
        );

      if (createdRule) {
        setRules(
          (current) => [
            createdRule,
            ...current,
          ]
        );
      } else {
        await loadDashboard(true);
      }

      resetRuleForm();
      setShowCreateRule(false);
      setSuccess(t.ruleCreated);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          t.unauthorized
      ) {
        setAuthorized(false);
        setMember(null);
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : t.error
      );
    } finally {
      setCreatingRule(false);
    }
  }

  function statusLabel(
    status: CouncilRuleStatus
  ) {
    switch (status) {
      case "active":
        return t.active;

      case "draft":
        return t.draft;

      case "in_review":
        return t.rulePending;

      case "approved":
        return t.ruleApproved;

      case "rejected":
        return t.ruleRejected;

      default:
        return status;
    }
  }

  function applicationStatusLabel(
    status: CouncilStatus
  ) {
    switch (status) {
      case "approved":
        return t.approved;

      case "rejected":
        return t.rejected;

      case "pending":
      default:
        return t.pending;
    }
  }

  function formatDate(
    value?: string
  ) {
    if (!value) {
      return "—";
    }

    try {
      return new Intl.DateTimeFormat(
        lang === "ar"
          ? "ar-EG"
          : "en-US",
        {
          dateStyle: "medium",
        }
      ).format(new Date(value));
    } catch {
      return value;
    }
  }

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF7EC] px-6">
        <div className="text-center">
          <div
            className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#B8860B]/20 border-t-[#B8860B]"
            aria-hidden="true"
          />

          <p className="mt-4 text-sm text-[#1A1A1A]/50">
            {t.loading}
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
            <Link
              href="/profile"
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
          </header>

          <div className="flex min-h-[75vh] items-center justify-center">
            <div className="w-full max-w-md rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-8 text-center shadow-xl shadow-[#1A1A1A]/5 sm:p-10">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl"
                aria-hidden="true"
              >
                🔒
              </div>

              <h1 className="mt-6 text-2xl font-semibold">
                {t.accessDeniedTitle}
              </h1>

              <p className="mt-4 text-sm leading-6 text-[#1A1A1A]/60">
                {t.accessDenied}
              </p>

              <Link
                href="/profile"
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A]"
              >
                {t.backToCouncil}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">
      <div className="mx-auto max-w-6xl">

        <header className="flex flex-col gap-4 border-b border-[#1A1A1A]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/profile"
            className="text-lg font-semibold tracking-tight"
          >
            {t.brand}
          </Link>

          <div className="flex flex-wrap items-center gap-3">
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

            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              disabled={refreshing}
              className="rounded-full border border-[#1A1A1A]/15 bg-white px-4 py-2 text-xs font-medium transition hover:border-[#B8860B]/50 disabled:opacity-50"
            >
              {refreshing
                ? t.refreshing
                : t.refresh}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#333]"
            >
              {t.logout}
            </button>
          </div>
        </header>

        <section className="py-12 sm:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/profile"
                className="text-sm text-[#1A1A1A]/50 transition hover:text-[#1A1A1A]"
              >
                {t.back}
              </Link>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                {t.title}
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-[#1A1A1A]/60">
                {t.subtitle}
              </p>
            </div>

            {member && (
              <div className="shrink-0 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-green-700/60">
                  {t.memberStatus}
                </p>

                <p className="mt-1 text-sm font-semibold text-green-800">
                  {t.approved}
                </p>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <section className="mb-6 rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-8">
          <h2 className="text-2xl font-semibold">
            {t.overview}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#FBF7EC] p-5">
              <p className="text-xs font-medium text-[#1A1A1A]/40">
                {t.memberStatus}
              </p>

              <p className="mt-2 text-lg font-semibold text-green-700">
                {t.approved}
              </p>
            </div>

            <div className="rounded-2xl bg-[#FBF7EC] p-5">
              <p className="text-xs font-medium text-[#1A1A1A]/40">
                {t.applications}
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-2xl bg-[#FBF7EC] p-5">
              <p className="text-xs font-medium text-[#1A1A1A]/40">
                {t.rules}
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {rules.length}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {t.applications}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/55">
                {t.applicationsDescription}
              </p>
            </div>

            <div className="rounded-full bg-[#B8860B]/10 px-4 py-2 text-xs font-semibold text-[#8A6500]">
              {pendingCount}
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#FBF7EC] px-5 py-6 text-center text-sm text-[#1A1A1A]/50">
              {t.noApplications}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {applications.map(
                (application) => {
                  const isLoading =
                    actionLoading ===
                    application.id;

                  return (
                    <article
                      key={
                        application.id
                      }
                      className="rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/50 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {t.applicantId}
                          </h3>

                          <p className="mt-2 break-all font-mono text-xs text-[#1A1A1A]/60">
                            {
                              application.user_id
                            }
                          </p>

                          <p className="mt-2 text-xs text-[#1A1A1A]/35">
                            {t.created}:{" "}
                            {formatDate(
                              application.created_at
                            )}
                          </p>
                        </div>

                        <span className="inline-flex w-fit rounded-full bg-[#B8860B]/10 px-3 py-1 text-xs font-semibold text-[#8A6500]">
                          {applicationStatusLabel(
                            application.status
                          )}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        {application.motivation && (
                          <div>
                            <p className="text-xs font-semibold text-[#1A1A1A]/40">
                              {
                                t.motivationLabel
                              }
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/70">
                              {
                                application.motivation
                              }
                            </p>
                          </div>
                        )}

                        {application.experience && (
                          <div>
                            <p className="text-xs font-semibold text-[#1A1A1A]/40">
                              {
                                t.experienceLabel
                              }
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/70">
                              {
                                application.experience
                              }
                            </p>
                          </div>
                        )}

                        {application.contribution && (
                          <div>
                            <p className="text-xs font-semibold text-[#1A1A1A]/40">
                              {
                                t.contributionLabel
                              }
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/70">
                              {
                                application.contribution
                              }
                            </p>
                          </div>
                        )}

                        {application.availability && (
                          <div>
                            <p className="text-xs font-semibold text-[#1A1A1A]/40">
                              {
                                t.availabilityLabel
                              }
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/70">
                              {
                                application.availability
                              }
                            </p>
                          </div>
                        )}

                        {typeof application.agreement ===
                          "boolean" && (
                          <div>
                            <p className="text-xs font-semibold text-[#1A1A1A]/40">
                              {
                                t.agreementLabel
                              }
                            </p>

                            <p className="mt-2 text-sm font-medium">
                              {
                                application.agreement
                                  ? t.yes
                                  : t.no
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      {application.status ===
                        "pending" && (
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            disabled={
                              isLoading
                            }
                            onClick={() =>
                              void updateApplication(
                                application,
                                "approved"
                              )
                            }
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isLoading
                              ? "..."
                              : t.approve}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isLoading
                            }
                            onClick={() =>
                              void updateApplication(
                                application,
                                "rejected"
                              )
                            }
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-white px-6 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t.reject}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="mb-12 rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-6 shadow-xl shadow-[#1A1A1A]/5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {t.rules}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/55">
                {t.rulesDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreateRule(
                  (current) =>
                    !current
                )
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A]"
            >
              {t.createRule}
            </button>
          </div>

          {showCreateRule && (
            <div className="mt-7 rounded-2xl border border-[#B8860B]/20 bg-[#FBF7EC] p-5">
              <h3 className="text-xl font-semibold">
                {t.createRuleTitle}
              </h3>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="rule-id"
                    className="text-sm font-semibold"
                  >
                    {t.ruleId}
                  </label>

                  <input
                    id="rule-id"
                    value={ruleId}
                    onChange={(e) =>
                      setRuleId(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.ruleIdPlaceholder
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ruleset-id"
                    className="text-sm font-semibold"
                  >
                    {t.rulesetId}
                  </label>

                  <input
                    id="ruleset-id"
                    value={rulesetId}
                    onChange={(e) =>
                      setRulesetId(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.rulesetIdPlaceholder
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rule-version"
                    className="text-sm font-semibold"
                  >
                    {t.version}
                  </label>

                  <input
                    id="rule-version"
                    type="number"
                    min={1}
                    value={version}
                    onChange={(e) =>
                      setVersion(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="region-code"
                    className="text-sm font-semibold"
                  >
                    {t.regionCode}
                  </label>

                  <input
                    id="region-code"
                    value={regionCode}
                    onChange={(e) =>
                      setRegionCode(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.regionCodePlaceholder
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="domain-scope"
                    className="text-sm font-semibold"
                  >
                    {t.domainScope}
                  </label>

                  <input
                    id="domain-scope"
                    value={domainScope}
                    onChange={(e) =>
                      setDomainScope(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.domainScopePlaceholder
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="text-sm font-semibold"
                  >
                    {t.category}
                  </label>

                  <input
                    id="category"
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.categoryPlaceholder
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="severity"
                    className="text-sm font-semibold"
                  >
                    {t.severity}
                  </label>

                  <select
                    id="severity"
                    value={severity}
                    onChange={(e) =>
                      setSeverity(
                        e.target.value
                      )
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  >
                    <option value="low">
                      low
                    </option>
                    <option value="medium">
                      medium
                    </option>
                    <option value="high">
                      high
                    </option>
                    <option value="critical">
                      critical
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="decision-type"
                    className="text-sm font-semibold"
                  >
                    {t.decisionType}
                  </label>

                  <select
                    id="decision-type"
                    value={decisionType}
                    onChange={(e) =>
                      setDecisionType(
                        e.target.value
                      )
                    }
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  >
                    <option value="safe">
                      safe
                    </option>
                    <option value="adjust">
                      adjust
                    </option>
                    <option value="block">
                      block
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="trigger-description"
                    className="text-sm font-semibold"
                  >
                    {
                      t.triggerDescription
                    }
                  </label>

                  <textarea
                    id="trigger-description"
                    value={
                      triggerDescription
                    }
                    onChange={(e) =>
                      setTriggerDescription(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.triggerDescriptionPlaceholder
                    }
                    rows={4}
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full resize-y rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="adjustment-instruction"
                    className="text-sm font-semibold"
                  >
                    {
                      t.adjustmentInstruction
                    }
                  </label>

                  <textarea
                    id="adjustment-instruction"
                    value={
                      adjustmentInstruction
                    }
                    onChange={(e) =>
                      setAdjustmentInstruction(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.adjustmentInstructionPlaceholder
                    }
                    rows={4}
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full resize-y rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="fallback-message"
                    className="text-sm font-semibold"
                  >
                    {
                      t.fallbackMessage
                    }
                  </label>

                  <textarea
                    id="fallback-message"
                    value={
                      fallbackMessage
                    }
                    onChange={(e) =>
                      setFallbackMessage(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.fallbackMessagePlaceholder
                    }
                    rows={4}
                    disabled={
                      creatingRule
                    }
                    className="mt-2 w-full resize-y rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#B8860B]"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    void handleCreateRule()
                  }
                  disabled={
                    creatingRule ||
                    !ruleId.trim() ||
                    !rulesetId.trim() ||
                    !regionCode.trim() ||
                    !domainScope.trim() ||
                    !category.trim() ||
                    !triggerDescription.trim() ||
                    !adjustmentInstruction.trim() ||
                    !fallbackMessage.trim()
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingRule
                    ? t.creating
                    : t.create}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateRule(
                      false
                    );
                    resetRuleForm();
                  }}
                  disabled={
                    creatingRule
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1A1A1A]/15 bg-white px-6 text-sm font-semibold transition hover:border-[#B8860B]/50"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {rules.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#FBF7EC] px-5 py-6 text-center text-sm text-[#1A1A1A]/50">
              {t.noRules}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {rules.map(
                (rule, index) => {
                  const ruleKey =
                    rule.rule_id ||
                    rule.id ||
                    `rule-${index}`;

                  return (
                    <article
                      key={ruleKey}
                      className="rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/50 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {rule.rule_id ||
                              rule.id ||
                              "Council Rule"}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#1A1A1A]/50">
                            {rule.category && (
                              <span>
                                {
                                  rule.category
                                }
                              </span>
                            )}

                            {rule.severity && (
                              <span>
                                {" "}
                                •{" "}
                                {
                                  rule.severity
                                }
                              </span>
                            )}

                            {rule.decision_type && (
                              <span>
                                {" "}
                                •{" "}
                                {
                                  rule.decision_type
                                }
                              </span>
                            )}
                          </div>

                          {rule.created_at && (
                            <p className="mt-1 text-xs text-[#1A1A1A]/35">
                              {t.created}:{" "}
                              {formatDate(
                                rule.created_at
                              )}
                            </p>
                          )}
                        </div>

                        <span
                          className={[
                            "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
                            rule.status ===
                            "active"
                              ? "bg-green-100 text-green-700"
                              : rule.status ===
                                  "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-[#B8860B]/10 text-[#8A6500]",
                          ].join(" ")}
                        >
                          {statusLabel(
                            rule.status
                          )}
                        </span>
                      </div>

                      {rule.trigger_description && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-[#1A1A1A]/40">
                            {
                              t.triggerDescription
                            }
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/65">
                            {
                              rule.trigger_description
                            }
                          </p>
                        </div>
                      )}

                      {rule.adjustment_instruction && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-[#1A1A1A]/40">
                            {
                              t.adjustmentInstruction
                            }
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/65">
                            {
                              rule.adjustment_instruction
                            }
                          </p>
                        </div>
                      )}

                      {rule.fallback_message && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-[#1A1A1A]/40">
                            {
                              t.fallbackMessage
                            }
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A1A1A]/65">
                            {
                              rule.fallback_message
                            }
                          </p>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer className="border-t border-[#1A1A1A]/10 py-8 text-center text-xs text-[#1A1A1A]/35">
          A DEVONEERS initiative
        </footer>
      </div>
    </main>
  );
}