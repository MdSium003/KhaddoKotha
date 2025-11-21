"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import {
  updateProfile,
  getFoodUsageLogs,
  getUserInventory,
  fetchResources,
  getFoodUsageAnalytics,
  type FoodUsageLog,
  type UserInventoryItem,
  type Resource,
  type AnalyticsResponse,
  type WeeklyTrend,
  type ConsumptionPattern,
  type Insight,
  type ImbalancedPattern,
  type HeatmapData,
} from "@/lib/api";

type BudgetPreferenceLevel = "low" | "medium" | "high" | "";

type Recommendation = {
  resource: Resource;
  reason: string;
};

export default function ProfilePage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [budgetPreference, setBudgetPreference] = useState<BudgetPreferenceLevel>("");
  const [location, setLocation] = useState("");
  const [dietaryNeeds, setDietaryNeeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Last usage data
  const [recentUsage, setRecentUsage] = useState<FoodUsageLog[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "usage" | "analytics" | "settings">("overview");
  const [userInventoryItems, setUserInventoryItems] = useState<UserInventoryItem[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [recommendedResources, setRecommendedResources] = useState<Recommendation[]>([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
      loadUserInventoryItems();
      loadResources();
    }
  }, [user]);

  useEffect(() => {
    if (!allResources.length) {
      setRecommendedResources([]);
      return;
    }

    const recs = buildRecommendations({
      resources: allResources,
      inventoryItems: userInventoryItems,
      usageLogs: recentUsage,
      budgetPreference,
    });

    setRecommendedResources(recs);
    setCurrentRecommendationIndex(0);
  }, [allResources, userInventoryItems, recentUsage, budgetPreference]);

  useEffect(() => {
    if (recommendedResources.length <= 1) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentRecommendationIndex((prev) => (prev + 1) % recommendedResources.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [recommendedResources]);

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

  const loadUserInventoryItems = async () => {
    try {
      const items = await getUserInventory();
      setUserInventoryItems(items);
    } catch (err) {
      console.error("Failed to load user inventory for recommendations:", err);
    }
  };

  const loadResources = async () => {
    try {
      const items = await fetchResources();
      setAllResources(items);
    } catch (err) {
      console.error("Failed to load resources:", err);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await getFoodUsageAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setAnalyticsLoading(false);
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

  const currentRecommendation = recommendedResources[currentRecommendationIndex] || null;

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

          {currentRecommendation && (
            <div
              className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg transition hover:shadow-xl cursor-pointer"
              onClick={() => setShowRecommendationsModal(true)}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">
                    Personalized Advice
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{currentRecommendation.resource.title}</h2>
                  {currentRecommendation.resource.description && (
                    <p className="mt-2 text-sm text-slate-600">
                      {currentRecommendation.resource.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-semibold text-emerald-700">
                    {currentRecommendation.reason}
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  {currentRecommendation.resource.url && (
                    <a
                      href={currentRecommendation.resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center rounded-full border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    >
                      Open Resource
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRecommendationsModal(true);
                    }}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    See all personalized tips
                  </button>
                </div>
              </div>
            </div>
          )}

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
              onClick={() => {
                setActiveTab("analytics");
                if (!analytics) loadAnalytics();
              }}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === "analytics"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Analytics
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

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-slate-600">Analyzing your consumption patterns...</p>
                  </div>
                </div>
              ) : !analytics || analytics.totalLogsAnalyzed === 0 ? (
                <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Not enough data</h3>
                    <p className="text-slate-500">Track your food usage for at least a week to see analytics</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Imbalanced Patterns Section */}
                  {analytics.imbalancedPatterns && analytics.imbalancedPatterns.length > 0 && (
                    <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-8 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-xl font-bold text-red-900">Imbalanced Patterns Detected</h3>
                      </div>
                      <p className="text-sm text-red-700 mb-6">
                        We've identified some imbalanced consumption patterns that may affect your nutrition and food waste management.
                      </p>
                      <div className="space-y-4">
                        {analytics.imbalancedPatterns.map((pattern, index) => (
                          <div
                            key={index}
                            className={`rounded-2xl p-5 border-l-4 ${
                              pattern.severity === 'high'
                                ? 'bg-red-100 border-red-500'
                                : 'bg-orange-100 border-orange-500'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {pattern.severity === 'high' ? (
                                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-semibold text-slate-900">{pattern.message}</p>
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    pattern.severity === 'high'
                                      ? 'bg-red-200 text-red-800'
                                      : 'bg-orange-200 text-orange-800'
                                  }`}>
                                    {pattern.severity === 'high' ? 'High' : 'Medium'} Priority
                                  </span>
                                  {pattern.category && (
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/60 text-slate-600 capitalize">
                                      {pattern.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-700">{pattern.recommendation}</p>
                                <div className="mt-2 text-xs text-slate-600">
                                  <span className="font-medium">Pattern Type: </span>
                                  <span className="capitalize">{pattern.type.replace(/_/g, ' ')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights Section */}
                  {analytics.insights.length > 0 && (
                    <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                      <h3 className="text-xl font-bold text-slate-900 mb-6">Insights & Recommendations</h3>
                      <div className="space-y-4">
                        {analytics.insights.map((insight, index) => (
                          <div
                            key={index}
                            className={`rounded-2xl p-5 border-l-4 ${insight.type === 'success'
                              ? 'bg-green-50 border-green-500'
                              : insight.type === 'warning'
                                ? 'bg-orange-50 border-orange-500'
                                : insight.type === 'error'
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-blue-50 border-blue-500'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {insight.type === 'success' && (
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                {insight.type === 'warning' && (
                                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                )}
                                {insight.type === 'info' && (
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-slate-900">{insight.message}</p>
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/60 text-slate-600 capitalize">
                                    {insight.category}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600">{insight.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Trends */}
                  <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Weekly Consumption Trends</h3>
                    <div className="space-y-4">
                      {analytics.weeklyTrends.map((week) => (
                        <div key={week.weekNumber} className="border border-slate-200 rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900">Week {week.weekNumber}</h4>
                              <p className="text-sm text-slate-500">
                                {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-600">{week.totalQuantity}</p>
                              <p className="text-xs text-slate-500">{week.totalItems} items</p>
                            </div>
                          </div>
                          {Object.keys(week.categoryBreakdown).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-xs font-semibold text-slate-600 mb-2">Category Breakdown:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(week.categoryBreakdown).map(([category, data]) => (
                                  <span key={category} className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                                    {category}: {data.quantity.toFixed(1)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consumption Patterns */}
                  <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Consumption Patterns by Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analytics.consumptionPatterns).map(([category, pattern]) => (
                        <div key={category} className="border border-slate-200 rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900 capitalize">{category}</h4>
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full ${pattern.status === 'over-consumption'
                                ? 'bg-orange-100 text-orange-700'
                                : pattern.status === 'under-consumption'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                                }`}
                            >
                              {pattern.status === 'over-consumption' ? 'High' : pattern.status === 'under-consumption' ? 'Low' : 'Normal'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Weekly Average:</span>
                              <span className="font-semibold text-slate-900">{pattern.weeklyAverage} units</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Total (4 weeks):</span>
                              <span className="font-semibold text-slate-900">{pattern.totalQuantity}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Trend:</span>
                              <span
                                className={`font-semibold capitalize ${pattern.trend === 'increasing'
                                  ? 'text-orange-600'
                                  : pattern.trend === 'decreasing'
                                    ? 'text-blue-600'
                                    : 'text-slate-600'
                                  }`}
                              >
                                {pattern.trend === 'increasing' ? '↗ Increasing' : pattern.trend === 'decreasing' ? '↘ Decreasing' : '→ Stable'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heatmap Visualization */}
                  {analytics.heatmapData && analytics.heatmapData.categories.length > 0 && (
                    <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Consumption Heatmap</h3>
                          <p className="text-sm text-slate-500 mt-1">Visual representation of consumption by category and week</p>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="mb-6 flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-600">Intensity:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Low</span>
                          <div className="flex gap-1">
                            {[0, 0.25, 0.5, 0.75, 1.0].map((intensity) => (
                              <div
                                key={intensity}
                                className="w-8 h-8 rounded border border-slate-200"
                                style={{
                                  backgroundColor: `rgba(16, 185, 129, ${intensity})`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">High</span>
                        </div>
                        {analytics.heatmapData.maxValue > 0 && (
                          <span className="text-xs text-slate-500 ml-auto">
                            Max: {analytics.heatmapData.maxValue} units
                          </span>
                        )}
                      </div>

                      {/* Heatmap Grid */}
                      <div className="overflow-x-auto">
                        <div className="inline-block min-w-full">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="sticky left-0 z-10 bg-white border-b-2 border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                  Category
                                </th>
                                {analytics.heatmapData.weeks.map((week) => (
                                  <th
                                    key={week.weekNumber}
                                    className="border-b-2 border-slate-300 px-3 py-3 text-center text-xs font-semibold text-slate-700 min-w-[100px]"
                                  >
                                    <div className="flex flex-col">
                                      <span>{week.label}</span>
                                      <span className="text-xs font-normal text-slate-500 mt-1">{week.dateRange}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.heatmapData.categories.map((category) => (
                                <tr key={category} className="hover:bg-slate-50 transition-colors">
                                  <td className="sticky left-0 z-10 bg-white border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 capitalize">
                                    {category}
                                  </td>
                                  {analytics.heatmapData.weeks.map((week) => {
                                    const cellData = analytics.heatmapData.data.find(
                                      (d) => d.category === category && d.week === week.weekNumber
                                    );
                                    const value = cellData?.value || 0;
                                    const intensity = analytics.heatmapData.maxValue > 0 
                                      ? Math.min(value / analytics.heatmapData.maxValue, 1) 
                                      : 0;
                                    
                                    return (
                                      <td
                                        key={`${category}-${week.weekNumber}`}
                                        className="border-b border-slate-200 px-3 py-3 text-center relative group"
                                      >
                                        <div
                                          className="mx-auto w-full h-12 rounded-lg border border-slate-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                                          style={{
                                            backgroundColor: `rgba(16, 185, 129, ${intensity * 0.8 + 0.2})`,
                                            color: intensity > 0.5 ? 'white' : 'rgb(51, 65, 85)',
                                          }}
                                          title={`${category}: ${value} units in ${week.label}`}
                                        >
                                          <span className="text-xs font-semibold">
                                            {value > 0 ? value.toFixed(1) : '-'}
                                          </span>
                                        </div>
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                          {category}: {value} units
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary Stats */}
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Total Categories</p>
                            <p className="text-lg font-bold text-slate-900">{analytics.heatmapData.categories.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Weeks Analyzed</p>
                            <p className="text-lg font-bold text-slate-900">{analytics.heatmapData.weeks.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Peak Consumption</p>
                            <p className="text-lg font-bold text-emerald-600">{analytics.heatmapData.maxValue} units</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Data Points</p>
                            <p className="text-lg font-bold text-slate-900">{analytics.heatmapData.data.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

      {showRecommendationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">
                  Personalized Resources
                </p>
                <h3 className="text-2xl font-bold text-slate-900">Tips chosen for you</h3>
              </div>
              <button
                onClick={() => setShowRecommendationsModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {recommendedResources.length === 0 ? (
              <p className="text-sm text-slate-500">No personalized tips available yet. Log some inventory or usage to unlock recommendations.</p>
            ) : (
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                {recommendedResources.map((rec) => (
                  <div key={rec.resource.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                          {rec.resource.category} · {rec.resource.type}
                        </p>
                        <h4 className="text-lg font-semibold text-slate-900">{rec.resource.title}</h4>
                      </div>
                      <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold text-emerald-600">
                        {rec.reason}
                      </span>
                    </div>
                    {rec.resource.description && (
                      <p className="mt-2 text-sm text-slate-600">{rec.resource.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Added to Global Codex
                      </p>
                      {rec.resource.url && (
                        <a
                          href={rec.resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Open resource →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildRecommendations({
  resources,
  inventoryItems,
  usageLogs,
  budgetPreference,
}: {
  resources: Resource[];
  inventoryItems: UserInventoryItem[];
  usageLogs: FoodUsageLog[];
  budgetPreference: BudgetPreferenceLevel;
}): Recommendation[] {
  if (!resources.length) {
    return [];
  }

  const inventoryCategories = inventoryItems.map((item) => (item.category || "").toLowerCase());
  const usageCategories = usageLogs.map((log) => (log.category || "").toLowerCase());
  const hasCategory = (keyword: string) =>
    inventoryCategories.some((cat) => cat.includes(keyword)) || usageCategories.some((cat) => cat.includes(keyword));

  const matches: { category: Resource["category"]; reason: string }[] = [];

  if (hasCategory("dairy")) {
    matches.push({ category: "storage_tips", reason: "Related to: Dairy category" });
  }
  if (hasCategory("meat") || hasCategory("protein")) {
    matches.push({ category: "storage_tips", reason: "Related to: Protein category" });
  }
  if (hasCategory("fruit") || hasCategory("vegetable")) {
    matches.push({ category: "waste_reduction", reason: "Related to: Produce usage" });
  }
  if (usageLogs.length >= 5 || inventoryItems.length >= 5) {
    matches.push({ category: "meal_planning", reason: "Related to: Weekly cooking activity" });
  }
  if (budgetPreference === "low") {
    matches.push({ category: "budget", reason: "Related to: Budget preference (low)" });
  }
  matches.push({ category: "nutrition", reason: "Related to: General nutrition" });

  const usedResourceIds = new Set<number>();
  const recommendations: Recommendation[] = [];

  for (const match of matches) {
    const resource = resources.find(
      (res) => res.category === match.category && !usedResourceIds.has(res.id),
    );
    if (resource) {
      recommendations.push({ resource, reason: match.reason });
      usedResourceIds.add(resource.id);
    }
  }

  return recommendations;
}
