"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { updateProfile, getFoodUsageLogs, type FoodUsageLog } from "@/lib/api";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [budgetPreference, setBudgetPreference] = useState<"low" | "medium" | "high" | "">("");
  const [location, setLocation] = useState("");
  const [dietaryNeeds, setDietaryNeeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Last usage data
  const [recentUsage, setRecentUsage] = useState<FoodUsageLog[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "usage" | "settings">("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBudgetPreference(user.budgetPreferences || "");
      setLocation(user.location || "");
      setDietaryNeeds(user.dietaryNeeds || "");
      loadRecentUsage();
    }
  }, [user]);

  const loadRecentUsage = async () => {
    setUsageLoading(true);
    try {
      // Get last 7 days of usage
      const logs: FoodUsageLog[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = await getFoodUsageLogs(dateStr);
        logs.push(...dayLogs);
      }
      setRecentUsage(logs);
    } catch (error) {
      console.error("Failed to load usage logs:", error);
    } finally {
      setUsageLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await updateProfile({
        name,
        budgetPreferences: budgetPreference,
        location,
        dietaryNeeds,
      });
      await refreshUser();
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Calculate usage statistics
  const totalItemsUsed = recentUsage.length;
  const totalQuantity = recentUsage.reduce((sum, log) => sum + log.quantity, 0);
  const categories = [...new Set(recentUsage.map(log => log.category))];

  // Group by category for chart
  const categoryData = categories.map(cat => ({
    category: cat,
    count: recentUsage.filter(log => log.category === cat).length,
    quantity: recentUsage.filter(log => log.category === cat).reduce((sum, log) => sum + log.quantity, 0)
  }));

  // Group by date for timeline
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyUsage = last7Days.map(date => ({
    date,
    count: recentUsage.filter(log => log.usageDate === date).length
  }));

  const maxDailyCount = Math.max(...dailyUsage.map(d => d.count), 1);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#BCEBD7] flex items-center justify-center">
        <div className="text-slate-900 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 pt-24">
        <SiteHeader />

        <main className="mt-10 flex flex-1 flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">My Profile</h1>
              <p className="text-slate-600">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-100 border border-red-300 p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-100 border border-green-300 p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === "overview"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === "usage"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Recent Usage
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === "settings"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Settings
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                      <p className="text-slate-600">{user.email}</p>
                      {location && (
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700 mb-1">Budget Preference</p>
                    <p className="text-lg font-bold text-emerald-900 capitalize">{budgetPreference || "Not set"}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-700 mb-1">Dietary Needs</p>
                    <p className="text-lg font-bold text-blue-900">{dietaryNeeds || "None specified"}</p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-4">
                    <p className="text-sm font-medium text-purple-700 mb-1">Member Since</p>
                    <p className="text-lg font-bold text-purple-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-700">Items Used (7 days)</p>
                      <p className="text-3xl font-bold text-emerald-900 mt-1">{totalItemsUsed}</p>
                    </div>
                    <div className="p-3 bg-emerald-200 rounded-xl">
                      <svg className="w-8 h-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Quantity</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">{totalQuantity.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-xl">
                      <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Categories</p>
                      <p className="text-3xl font-bold text-orange-900 mt-1">{categories.length}</p>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-xl">
                      <svg className="w-8 h-8 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Timeline Chart */}
              <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-6">7-Day Usage Timeline</h3>
                <div className="space-y-3">
                  {dailyUsage.map((day, index) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-slate-600">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full flex items-center justify-end px-3 transition-all"
                          style={{ width: `${(day.count / maxDailyCount) * 100}%` }}
                        >
                          {day.count > 0 && (
                            <span className="text-xs font-bold text-white">{day.count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Usage Tab */}
          {activeTab === "usage" && (
            <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Food Usage (Last 7 Days)</h3>

              {usageLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                  <p className="text-slate-600">Loading usage data...</p>
                </div>
              ) : recentUsage.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No usage data</h3>
                  <p className="text-slate-500">Start tracking your food usage in the Daily Tracker</p>
                </div>
              ) : (
                <>
                  {/* Category Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">By Category</h4>
                      <div className="space-y-3">
                        {categoryData.map((cat, index) => (
                          <div key={cat.category} className="flex items-center gap-3">
                            <div className="w-32 text-sm font-medium text-slate-700 capitalize">{cat.category}</div>
                            <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end px-2"
                                style={{ width: `${(cat.count / totalItemsUsed) * 100}%` }}
                              >
                                <span className="text-xs font-bold text-white">{cat.count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Recent Items</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recentUsage.slice(0, 10).map((log, index) => (
                          <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{log.itemName}</p>
                              <p className="text-xs text-slate-500 capitalize">{log.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600">{log.quantity}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Account Settings</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name);
                        setBudgetPreference(user.budgetPreferences || "");
                        setLocation(user.location || "");
                        setDietaryNeeds(user.dietaryNeeds || "");
                      }}
                      className="rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 font-medium opacity-60"
                  />
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Dhaka, Bangladesh"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  />
                </div>

                {/* Budget Preference */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Budget Preference</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => isEditing && setBudgetPreference(level)}
                        disabled={!isEditing}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all border-2 ${budgetPreference === level
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300"
                          } ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dietary Needs */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Needs</label>
                  <textarea
                    value={dietaryNeeds}
                    onChange={(e) => setDietaryNeeds(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Vegetarian, Gluten-free, etc."
                    rows={3}
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
