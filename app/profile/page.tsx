"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const storedUser = localStorage.getItem("herai_user");

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);

      setUser({
        id: parsedUser.id,
        email: parsedUser.email,
        firstName:
          parsedUser.firstName ||
          parsedUser.first_name ||
          "",
        lastName:
          parsedUser.lastName ||
          parsedUser.last_name ||
          "",
      });
    } catch {
      localStorage.removeItem("herai_user");
    }
  }

  setLoading(false);
}, []);

  function handleLogout() {
    localStorage.removeItem("herai_user");
    localStorage.removeItem("herai_session");
    localStorage.removeItem("herai_access_token");
    localStorage.removeItem("herai_refresh_token");

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

  return (
    <main className="min-h-screen bg-[#FBF7EC] px-4 py-8 text-[#1A1A1A] sm:px-8">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-5">

          <div className="text-lg font-semibold tracking-tight">
            HerAI Mashroo3
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#333]"
          >
            Log out
          </button>

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
                  <h2 className="text-2xl font-semibold">
                    {fullName}
                  </h2>

                  <p className="mt-2 text-sm text-[#1A1A1A]/50">
                    {user.email || "No email provided"}
                  </p>
                </div>

              </div>

              {/* CHAT CTA */}
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

          {/* CHAT DESTINATION */}
          <div className="mt-6 rounded-[2rem] border border-[#B8860B]/20 bg-[#B8860B]/[0.06] p-7 sm:p-9">

            <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#B8860B]/10 text-xl">
                  💬
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Ready to talk to HerAI?
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#1A1A1A]/55">
                    Ask questions about pricing, customers, suppliers,
                    costs, growth, permits, risk, and your everyday business
                    decisions.
                  </p>
                </div>

              </div>

              <Link
                href="/chat"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] px-6 text-sm font-semibold text-white transition hover:bg-[#333]"
              >
                Go to Chat
              </Link>

            </div>

          </div>

        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#1A1A1A]/10 py-8 text-center text-xs text-[#1A1A1A]/35">
          A DEVONEERS initiative
        </footer>

      </div>
    </main>
  );
}