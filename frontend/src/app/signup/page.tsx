"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { signup, googleAuth, setAuthToken, getCurrentUser } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { setupGoogleButton, type GoogleUserInfo } from "@/lib/google-auth";

export default function SignupPage() {
  const router = useRouter();
  const { login: setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await signup({ name, email, password });
      setAuthToken(response.token);
      // Fetch full user profile to get avatarUrl if available
      try {
        const fullUser = await getCurrentUser();
        setUser(fullUser);
      } catch {
        // If fetching full user fails, use the basic user from signup response
        setUser(response.user);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (userInfo: GoogleUserInfo) => {
    setError("");
    setLoading(true);

    try {
      const response = await googleAuth({
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.picture,
      });
      setAuthToken(response.token);
      // Fetch full user profile to get avatarUrl if available
      try {
        const fullUser = await getCurrentUser();
        setUser(fullUser);
      } catch {
        // If fetching full user fails, use the basic user from login response
        setUser(response.user);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (err: Error) => {
    setError(err.message || "Failed to sign up with Google.");
    setLoading(false);
  };

  useEffect(() => {
    // Wait for Google Identity Services to load
    const checkGoogle = setInterval(() => {
      if (window.google && googleButtonRef.current) {
        clearInterval(checkGoogle);
        setupGoogleButton(
          googleButtonRef.current,
          handleGoogleSuccess,
          handleGoogleError
        );
      }
    }, 100);

    // Cleanup after 10 seconds if Google doesn't load
    const timeout = setTimeout(() => {
      clearInterval(checkGoogle);
      if (!window.google) {
        console.warn("Google Identity Services failed to load");
      }
    }, 10000);

    return () => {
      clearInterval(checkGoogle);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900 flex flex-col">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <SiteHeader />

        <main className="mt-10 flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900">
                  Create your account
                </h1>
                <p className="mt-2 text-slate-600">
                  Join KhaddoKotha to get started
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="••••••••"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Must be at least 6 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-[#BCEBD7] shadow-lg shadow-emerald-300/40 transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-slate-300"></div>
                <span className="px-4 text-sm text-slate-500">or</span>
                <div className="flex-1 border-t border-slate-300"></div>
              </div>

              <div
                ref={googleButtonRef}
                className="w-full flex justify-center"
                style={{ minHeight: "40px" }}
              />
              {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <p className="mt-2 text-xs text-center text-slate-500">
                  Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable.
                </p>
              )}

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

