"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Recipes", href: "/#recipes" },
  { label: "Community", href: "/#community" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-6 z-50 flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-lg">
      <Link href="/" className="text-xl font-bold tracking-tight text-orange-600">
        KhaddoKotha
      </Link>
      <nav className="flex flex-wrap gap-6 text-sm font-medium text-stone-600">
        {navigation.map((item) => (
          <Link
            key={item.href}
            className="transition hover:text-orange-600"
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-full bg-stone-200"></div>
        ) : user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:border-orange-200"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline">{user.name}</span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

