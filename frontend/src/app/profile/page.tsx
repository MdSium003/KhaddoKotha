"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#BCEBD7] text-slate-900 flex flex-col">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
          <SiteHeader />
          <main className="mt-10 flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-emerald-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading profile...</p>
            </div>
          </main>
          <SiteFooter />
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900 flex flex-col">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <SiteHeader />

        <main className="mt-10 flex flex-1 flex-col gap-8">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
              <button
                onClick={logout}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Logout
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-[200px,1fr]">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-32 w-32 rounded-full border-4 border-emerald-200 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-500 text-4xl font-bold text-white shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  {user.name}
                </h2>
              </div>

              {/* Profile Details */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        Full Name
                      </label>
                      <p className="text-lg font-semibold text-slate-900">
                        {user.name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        Email Address
                      </label>
                      <p className="text-lg text-slate-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        User ID
                      </label>
                      <p className="text-sm font-mono text-slate-600">
                        #{user.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-700">
                    Quick Actions
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button className="rounded-lg border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                      Edit Profile
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Change Password
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Privacy Settings
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Notification Preferences
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

