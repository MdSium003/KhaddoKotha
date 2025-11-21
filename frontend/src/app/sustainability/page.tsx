"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getSustainabilityScores,
  calculateSustainabilityScores,
  type SustainabilityScoresResponse,
  type UserBadge,
  getFoodUsageAnalytics,
  type AnalyticsResponse,
  type WeeklyTrend,
} from "@/lib/api";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";

const badgeConfig: Record<string, { emoji: string; name: string; description: string }> = {
  nutri_ninja: {
    emoji: "🥦",
    name: "NutriNinja",
    description: "Earned for consistently eating healthy, balanced meals",
  },
  waste_warrior: {
    emoji: "♻️",
    name: "Waste Warrior",
    description: "Earned for using items before they expire or reducing food waste",
  },
  budget_boss: {
    emoji: "💸",
    name: "Budget Boss",
    description: "Earned for staying under budget and saving money on meals",
  },
};

export default function SustainabilityPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<SustainabilityScoresResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      await calculateSustainabilityScores();
      const [scoreData, analyticsData] = await Promise.all([
        getSustainabilityScores(),
        getFoodUsageAnalytics(),
      ]);
      setScores(scoreData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError("Failed to load sustainability insights. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <SiteHeader />
        <main className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Sustainability Points</h1>
            <p className="text-lg text-slate-600">Please log in to view your sustainability scores.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <SiteHeader />
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">
              Sustainability Points
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Track your impact on nutrition, sustainability, and budget management. Earn points and badges for making healthy, sustainable choices!
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-slate-600">Loading your scores...</p>
            </div>
          ) : scores ? (
            <>
              {/* Total Score Card */}
              <div className="mb-8">
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center">
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/10 border-4 border-white/60 flex items-center justify-center shadow-xl">
                        <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                          {scores.totalScore}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-emerald-100 text-sm font-semibold uppercase tracking-widest mb-1">
                        Total SNS Score
                      </p>
                      <p className="text-lg md:text-xl font-medium text-emerald-50 mb-1">
                        Your impact across <span className="font-semibold">Nutrition</span>,{" "}
                        <span className="font-semibold">Sustainability</span> &{" "}
                        <span className="font-semibold">Savings</span>
                      </p>
                      <p className="text-sm text-emerald-100/90">
                        Keep making smart choices with food to grow this circle every day. 🌱
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end justify-between text-right">
                    <div className="text-6xl opacity-25">🏆</div>
                    <p className="text-sm text-emerald-50/90 mt-2">
                      Consistency unlocks <span className="font-semibold">NutriNinja</span>,{" "}
                      <span className="font-semibold">Waste Warrior</span> &{" "}
                      <span className="font-semibold">Budget Boss</span> badges.
                    </p>
                  </div>
                </div>
              </div>

              {/* Weekly Consumption Snapshot */}
              {analytics?.weeklyTrends?.length ? (
                <WeeklyNutritionSummary trend={analytics.weeklyTrends.at(-1)!} />
              ) : (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Weekly Consumption Snapshot</h3>
                  <div className="bg-white rounded-2xl p-10 text-center text-slate-500 shadow-inner border border-dashed border-slate-200">
                    <p>No weekly consumption data yet. Log meals in the Daily Tracker to see your weekly nutrition summary.</p>
                  </div>
                </div>
              )}

              {/* Badges Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Your Badges</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {Object.entries(badgeConfig).map(([key, config]) => {
                    const badge = scores.badges.find((b) => b.type === key);
                    return (
                      <div
                        key={key}
                        className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
                          badge ? "border-emerald-300" : "border-slate-200 opacity-60"
                        }`}
                      >
                        <div className="text-6xl mb-4 text-center">{config.emoji}</div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2 text-center">
                          {config.name}
                        </h4>
                        <p className="text-sm text-slate-600 text-center mb-4">
                          {config.description}
                        </p>
                        {badge ? (
                          <div className="text-center">
                            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                              ✓ Earned
                            </span>
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date(badge.earnedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="inline-block px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-sm font-semibold">
                              Not Earned
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today's SNS Summary */}
              {scores.todayScore && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Today&apos;s SNS Summary</h3>
                  <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">Great job today!</p>
                      <p className="text-3xl font-bold text-slate-900">
                        You earned{" "}
                        <span className="text-emerald-600">
                          {scores.todayScore.totalPoints > 0 ? "+" : ""}
                          {scores.todayScore.totalPoints}
                        </span>{" "}
                        SNS points today
                      </p>
                      <p className="mt-2 text-sm text-slate-600 max-w-xl">
                        SNS = <span className="font-semibold">Sustainability + Nutrition + Savings</span>. Every point reflects
                        healthier eating, less food waste, and better budget choices.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                      <div className="rounded-xl border border-slate-200 px-4 py-3 bg-slate-50/60">
                        <p className="text-xs font-medium text-slate-500">Healthy choices</p>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          {scores.todayScore.nutritionPoints > 0 ? "+" : ""}
                          {scores.todayScore.nutritionPoints}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Balanced meals today</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 px-4 py-3 bg-slate-50/60">
                        <p className="text-xs font-medium text-slate-500">Reduced waste</p>
                        <p className="text-xl font-bold text-green-600 mt-1">
                          {scores.todayScore.sustainabilityPoints > 0 ? "+" : ""}
                          {scores.todayScore.sustainabilityPoints}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Used items before expiry</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 px-4 py-3 bg-slate-50/60">
                        <p className="text-xs font-medium text-slate-500">Saved money</p>
                        <p className="text-xl font-bold text-amber-600 mt-1">
                          {scores.todayScore.budgetPoints > 0 ? "+" : ""}
                          {scores.todayScore.budgetPoints}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Compared to your budget</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scoring Rules */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">How Scoring Works</h3>
                <div className="space-y-6">
                  <ScoringRule
                    title="Sustainability Points"
                    icon="🌍"
                    rules={[
                      "0-2 days left: +8 points",
                      "3-5 days left: +5 points",
                      "6-10 days left: +3 points",
                      "11+ days left: +1 point",
                      "Item expired: -10 points",
                    ]}
                    description="Based on item expiration dates from your inventory. Promotes zero food waste and smart consumption."
                  />
                  <ScoringRule
                    title="Nutrition Points"
                    icon="🥗"
                    rules={[
                      "5+ categories consumed: +10 points",
                      "4 categories consumed: +7 points",
                      "3 categories consumed: +5 points",
                      "2 categories consumed: +3 points",
                      "1 category consumed: +1 point",
                    ]}
                    description="Based on balanced meal consumption across different food categories."
                  />
                  <ScoringRule
                    title="Budget Points"
                    icon="💰"
                    rules={[
                      "Spent < budget & saved 30%+: +10 points",
                      "Spent < budget: +5 points",
                      "Overspent: -5 points",
                    ]}
                    description="Compares your daily spending to your daily budget. Rewards affordability and resource efficiency."
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-600">No scores available. Calculate your scores to get started!</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function WeeklyNutritionSummary({ trend }: { trend: WeeklyTrend }) {
  const focusCategories = [
    { key: "Fruit", label: "Fruits", accent: "from-rose-400 to-red-500" },
    { key: "Vegetable", label: "Vegetables", accent: "from-green-400 to-emerald-500" },
    { key: "Protein", label: "Protein", accent: "from-purple-400 to-indigo-500" },
    { key: "Dairy", label: "Dairy", accent: "from-blue-400 to-cyan-500" },
    { key: "Grain", label: "Grains", accent: "from-amber-400 to-orange-500" },
  ];

  const focusCards = focusCategories.map(({ key, label, accent }) => {
    const breakdown = trend.categoryBreakdown[key] ?? { quantity: 0, count: 0 };
    return {
      label,
      key,
      accent,
      quantity: Number(breakdown.quantity || 0),
      count: Number(breakdown.count || 0),
    };
  });

  const otherQuantity = Object.entries(trend.categoryBreakdown).reduce((sum, [category, info]) => {
    if (focusCategories.some((c) => c.key === category)) return sum;
    return sum + Number(info.quantity || 0);
  }, 0);

  if (otherQuantity > 0) {
    focusCards.push({
      label: "Other",
      key: "Other",
      accent: "from-slate-400 to-slate-500",
      quantity: otherQuantity,
      count: Object.entries(trend.categoryBreakdown).reduce((sum, [category, info]) => {
        if (focusCategories.some((c) => c.key === category)) return sum;
        return sum + Number(info.count || 0);
      }, 0),
    });
  }

  const maxQuantity = Math.max(...focusCards.map((card) => card.quantity), 1);
  const uniqueCategories = Object.keys(trend.categoryBreakdown).length;
  const diversityScore = Math.min(Math.round((uniqueCategories / focusCards.length) * 100), 100);

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-slate-900 mb-4">Weekly Consumption Snapshot</h3>
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-emerald-600 tracking-wider uppercase">Week {trend.weekNumber}</p>
            <p className="text-2xl font-bold text-slate-900">
              {new Date(trend.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
              {new Date(trend.weekEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total servings consumed: {Math.round(trend.totalQuantity)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Unique categories</p>
            <p className="text-3xl font-bold text-slate-900">{uniqueCategories}</p>
            <p className="text-xs text-slate-400">Diversity boosts nutrition coverage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          {focusCards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-slate-100 p-4 bg-gradient-to-br from-white to-slate-50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-600">{card.label}</p>
                <span className="text-xs font-bold text-slate-400">Items {card.count}</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {card.quantity % 1 === 0 ? card.quantity : card.quantity.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500 mb-3">Servings this week</p>
              <div className="w-full h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${card.accent}`}
                  style={{ width: `${Math.max((card.quantity / maxQuantity) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Nutrition Score</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{diversityScore}%</p>
            <p className="text-sm text-slate-500 mt-1">Category diversity goal: {focusCards.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Most eaten category</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {focusCards.reduce((prev, curr) => (curr.quantity > prev.quantity ? curr : prev)).label}
            </p>
            <p className="text-sm text-slate-500 mt-1">Balance with other groups next week</p>
          </div>
          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total meals tracked</p>
            <p className="text-4xl font-bold text-emerald-600 mt-2">{trend.totalItems}</p>
            <p className="text-sm text-slate-500 mt-1">Keep logging meals for deeper insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoringRule({
  title,
  icon,
  rules,
  description,
}: {
  title: string;
  icon: string;
  rules: string[];
  description: string;
}) {
  return (
    <div className="border-l-4 border-emerald-500 pl-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <h4 className="text-xl font-bold text-slate-900">{title}</h4>
      </div>
      <p className="text-slate-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {rules.map((rule, index) => (
          <li key={index} className="flex items-start gap-2 text-slate-700">
            <span className="text-emerald-600 mt-1">•</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

