"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applyForCouncil, getCouncilStatus } from "../../lib/api";

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [councilStatus, setCouncilStatus] =
    useState<CouncilState>("loading");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

    const token = localStorage.getItem("herai_access_token");

    if (token && currentUser?.id) {
      getCouncilStatus(currentUser.id, token)
        .then((member) => {
          if (member?.status) {
            setCouncilStatus(member.status);
          } else {
            fetch(`${API_URL}/api/council/members?status=approved`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then((res) => {
                if (res.ok) {
                  setCouncilStatus("approved");
                } else {
                  setCouncilStatus("none");
                }
              })
              .catch(() => setCouncilStatus("none"));
          }
        })
        .catch(() => {
          setCouncilStatus("none");
        });
    } else {
      setCouncilStatus("none");
    }

    setLoading(false);
  }, []);

  async function handleApplyCouncil() {
    setApplying(true);
    setApplyError("");
    setApplyMessage("");

    const token = localStorage.getItem("herai_access_token");

    if (!token) {
      setApplyError("You must be logged in to apply.");
      setApplying(false);
      return;
    }

    try {
      const result = await applyForCouncil(token);

      setCouncilStatus(result.status || "pending");

      setApplyMessage(
        "Your application has been submitted successfully! Existing council members can now review and approve your request."
      );
    } catch (err: any) {
      setApplyError(
        err.message || "Failed to submit application."
      );
    } finally {
      setApplying(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("herai_user");
    localStorage.removeItem("herai_session");
    localStorage.removeItem("herai_access_token");

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF7EC]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#B8860B]/20 border-t-[#B8860B]" />

          <p className="mt-4 text-sm text-[#1A1A1A]/50">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">
        <div className="mx-auto max-w-5xl">
          {/* HEADER */}
          <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
            >
              HerAI Mashroo3
            </Link>

            <Link
              href="/login"
              className="rounded-full bg-[#B8860B] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#96700A]"
            >
              Log in
            </Link>
          </header>

          {/* NOT LOGGED IN */}
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-8 text-center shadow-xl shadow-[#1A1A1A]/5 sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#B8860B]/10 text-2xl">
                👤
              </div>

              <h1 className="mt-6 text-2xl font-semibold">
                You're not logged in
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#1A1A1A]/55">
                Please log in to access your HerAI profile.
              </p>

              <Link
                href="/login"
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A]"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "HerAI User";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isCouncil = councilStatus === "approved";

  return (
    <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
          <div className="text-lg font-semibold tracking-tight">
            HerAI Mashroo3
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#333]"
            >
              Log out
            </button>
          </div>
        </header>

        {/* PROFILE */}
        <section className="py-12 sm:py-16">
          {/* INTRO */}
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
              HerAI
            </span>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Your profile
            </h1>

            <p className="mt-4 max-w-xl leading-7 text-[#1A1A1A]/60">
              Welcome back, {user.firstName || "there"}. Access your HerAI
              business guidance from here.
            </p>
          </div>

          {/* PROFILE CARD */}
          <div className="rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-7 shadow-xl shadow-[#1A1A1A]/5 sm:p-10">
            {/* USER HEADER */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                {/* AVATAR */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/10 text-xl font-semibold text-[#B8860B]">
                  {initials}
                </div>

                {/* USER INFO */}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                      {fullName}
                    </h2>

                    {isCouncil && (
                      <span className="rounded-full bg-[#B8860B]/15 px-3 py-1 text-xs font-semibold text-[#B8860B]">
                        ⚖️ Council Member
                      </span>
                    )}

                    {councilStatus === "pending" && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        ⏳ Council Request Pending
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-[#1A1A1A]/50">
                    {user.email || "No email provided"}
                  </p>
                </div>
              </div>

              {/* ONLY HERAI CHAT BUTTON */}
              <Link
                href="/chat"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#96700A]"
              >
                Open HerAI Chat →
              </Link>
            </div>

            {/* DIVIDER */}
            <div className="my-8 border-t border-[#1A1A1A]/10" />

            {/* ACCOUNT INFORMATION */}
            <div>
              <h3 className="text-lg font-semibold">
                Account information
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {/* FIRST NAME */}
                <div className="rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/40 p-5">
                  <p className="text-xs font-medium text-[#1A1A1A]/40">
                    First name
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {user.firstName || "Not provided"}
                  </p>
                </div>

                {/* LAST NAME */}
                <div className="rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/40 p-5">
                  <p className="text-xs font-medium text-[#1A1A1A]/40">
                    Last name
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {user.lastName || "Not provided"}
                  </p>
                </div>

                {/* EMAIL */}
                <div className="rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7EC]/40 p-5 sm:col-span-2">
                  <p className="text-xs font-medium text-[#1A1A1A]/40">
                    Email
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold">
                    {user.email || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NOTIFICATION MESSAGES */}
          {applyMessage && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
              {applyMessage}
            </div>
          )}

          {applyError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              {applyError}
            </div>
          )}

          {/* COUNCIL SECTION */}
          {councilStatus === "approved" && (
            /* APPROVED COUNCIL MEMBER */
            <div className="mt-6 rounded-[2rem] border border-[#B8860B]/30 bg-[#B8860B]/[0.08] p-7 sm:p-9">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#B8860B]/15 text-xl">
                    ⚖️
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">
                      Council Dashboard
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#1A1A1A]/55">
                      You are an approved HerAI Council member. Review
                      pending membership applications and configure
                      regional AI domain rules.
                    </p>
                  </div>
                </div>

                {/* ONLY COUNCIL BUTTON */}
                <Link
                  href="/council"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#B8860B] px-6 text-sm font-semibold text-white transition hover:bg-[#96700A]"
                >
                  Open Dashboard →
                </Link>
              </div>
            </div>
          )}

          {councilStatus === "pending" && (
            /* PENDING COUNCIL REQUEST */
            <div className="mt-6 rounded-[2rem] border border-amber-200 bg-amber-50/60 p-7 sm:p-9">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                    ⏳
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-[#1A1A1A]">
                      Council Application Pending
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#1A1A1A]/65">
                      Your application to join the HerAI Council has
                      been submitted. Existing council members can
                      review and approve your request from the council
                      dashboard.
                    </p>
                  </div>
                </div>

                <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100/80 px-6 text-xs font-semibold text-amber-900">
                  Status: Under Review
                </span>
              </div>
            </div>
          )}

          {(councilStatus === "none" ||
            councilStatus === "rejected") && (
            /* NOT APPLIED YET OR REJECTED */
            <div className="mt-6 rounded-[2rem] border border-[#1A1A1A]/10 bg-white p-7 shadow-xl shadow-[#1A1A1A]/5 sm:p-9">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#B8860B]/10 text-xl">
                    🏛️
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">
                      {councilStatus === "rejected"
                        ? "Council Application"
                        : "Join the HerAI Council"}
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#1A1A1A]/55">
                      {councilStatus === "rejected"
                        ? "Your previous council request was not approved. You may submit a new application."
                        : "Council members help guide HerAI safety policies, validate agricultural and business domain knowledge, and review new community rules."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={applying}
                  onClick={handleApplyCouncil}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] px-7 text-sm font-semibold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applying
                    ? "Submitting..."
                    : councilStatus === "rejected"
                    ? "Re-apply for Council"
                    : "Apply for Council →"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#1A1A1A]/10 py-8 text-center text-xs text-[#1A1A1A]/35">
          A DEVONEERS initiative
        </footer>
      </div>
    </main>
  );
}