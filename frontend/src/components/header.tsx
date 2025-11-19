"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

const navigation = [
  { label: "Mission", href: "/#mission" },
  { label: "Platform", href: "/#platform" },
  { label: "Modules", href: "/#modules" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-6 z-50 flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200/60 bg-white/90 px-6 py-4 shadow-sm backdrop-blur-lg">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        KhaddoKotha
      </Link>
      <nav className="flex flex-wrap gap-6 text-sm font-medium text-slate-600">
        {navigation.map((item) => (
          <Link
            key={item.href}
            className="transition hover:text-slate-900"
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-full bg-slate-200"></div>
        ) : user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline">{user.name}</span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-[#BCEBD7] shadow-lg shadow-emerald-300/40 transition hover:bg-slate-800"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

