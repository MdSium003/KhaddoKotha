"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { generateDietPlan, type DietPlan } from "@/lib/api";

export default function DietPlannerPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [dietBudget, setDietBudget] = useState(5);
    const [dietPreference, setDietPreference] = useState<"Veg" | "Non-Veg" | "Balanced">("Balanced");
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [dietLoading, setDietLoading] = useState(false);
    const [dietError, setDietError] = useState("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const handleGenerateDietPlan = async () => {
        setDietError("");
        setDietLoading(true);
        setDietPlan(null);

        try {
            const plan = await generateDietPlan(dietBudget, dietPreference);
            setDietPlan(plan);
        } catch (err) {
            setDietError(err instanceof Error ? err.message : "Failed to generate diet plan");
        } finally {
            setDietLoading(false);
        }
    };

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
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Diet Planner</h1>
                            <p className="text-slate-600">Generate personalized meal plans based on your budget and preferences</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Plan Settings</h2>

                        <div className="grid gap-6 md:grid-cols-2 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Daily Budget ($)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.5"
                                    value={dietBudget}
                                    onChange={(e) => setDietBudget(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-lg text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                />
                                <p className="text-xs text-slate-500 mt-1">Set your daily food budget</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Meal Preference
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["Veg", "Non-Veg", "Balanced"] as const).map((pref) => (
                                        <button
                                            key={pref}
                                            onClick={() => setDietPreference(pref)}
                                            className={`py-3 px-4 rounded-xl font-semibold transition-all border-2 ${dietPreference === pref
                                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg"
                                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300"
                                                }`}
                                        >
                                            {pref}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateDietPlan}
                            disabled={dietLoading || dietBudget <= 0}
                            className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {dietLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Your Meal Plan...
                                </span>
                            ) : (
                                "🍽️ Generate Meal Plan"
                            )}
                        </button>

                        {dietError && (
                            <div className="mt-6 rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-center gap-3">
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-800 font-medium">{dietError}</p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    {dietPlan && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Meal Cards */}
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Breakfast */}
                                <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-orange-200 rounded-xl">
                                            <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-orange-900">Breakfast</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {dietPlan.meals.breakfast.map((item, i) => (
                                            <li key={i} className="flex items-start justify-between gap-2 bg-white/60 rounded-lg p-3">
                                                <span className="text-sm font-medium text-slate-800 flex-1">{item.item}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.source === 'Home'
                                                        ? 'bg-blue-200 text-blue-800'
                                                        : 'bg-amber-200 text-amber-800'
                                                    }`}>
                                                    {item.source === 'Home' ? '🏠 Home' : `🛒 $${item.cost.toFixed(2)}`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Lunch */}
                                <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-emerald-200 rounded-xl">
                                            <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-emerald-900">Lunch</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {dietPlan.meals.lunch.map((item, i) => (
                                            <li key={i} className="flex items-start justify-between gap-2 bg-white/60 rounded-lg p-3">
                                                <span className="text-sm font-medium text-slate-800 flex-1">{item.item}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.source === 'Home'
                                                        ? 'bg-blue-200 text-blue-800'
                                                        : 'bg-amber-200 text-amber-800'
                                                    }`}>
                                                    {item.source === 'Home' ? '🏠 Home' : `🛒 $${item.cost.toFixed(2)}`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Dinner */}
                                <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-purple-200 rounded-xl">
                                            <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-purple-900">Dinner</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {dietPlan.meals.dinner.map((item, i) => (
                                            <li key={i} className="flex items-start justify-between gap-2 bg-white/60 rounded-lg p-3">
                                                <span className="text-sm font-medium text-slate-800 flex-1">{item.item}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.source === 'Home'
                                                        ? 'bg-blue-200 text-blue-800'
                                                        : 'bg-amber-200 text-amber-800'
                                                    }`}>
                                                    {item.source === 'Home' ? '🏠 Home' : `🛒 $${item.cost.toFixed(2)}`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                                <h3 className="text-2xl font-bold text-slate-900 mb-6">Plan Summary</h3>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <span className="font-semibold text-slate-700">Total Cost:</span>
                                            <span className={`text-2xl font-bold ${dietPlan.totalCost <= dietBudget ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                ${dietPlan.totalCost.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <span className="font-semibold text-slate-700">Budget:</span>
                                            <span className="text-2xl font-bold text-slate-900">${dietBudget.toFixed(2)}</span>
                                        </div>
                                        {dietPlan.totalCost <= dietBudget && (
                                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                                                <span className="font-semibold text-emerald-700">Savings:</span>
                                                <span className="text-2xl font-bold text-emerald-600">
                                                    ${(dietBudget - dietPlan.totalCost).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 rounded-xl">
                                            <p className="text-sm font-semibold text-blue-700 mb-2">🏠 Home Items Used:</p>
                                            <p className="text-sm text-blue-900">{dietPlan.homeItemsUsed.join(", ") || "None"}</p>
                                        </div>
                                        <div className="p-4 bg-amber-50 rounded-xl">
                                            <p className="text-sm font-semibold text-amber-700 mb-2">🛒 Store Items Used:</p>
                                            <p className="text-sm text-amber-900">{dietPlan.storeItemsUsed.join(", ") || "None"}</p>
                                        </div>
                                        {dietPlan.expiringItemsUsed && dietPlan.expiringItemsUsed.length > 0 && (
                                            <div className="p-4 bg-orange-50 rounded-xl">
                                                <p className="text-sm font-semibold text-orange-700 mb-2">⚠️ Expiring Items Used:</p>
                                                <p className="text-sm text-orange-900">{dietPlan.expiringItemsUsed.join(", ")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {dietPlan.sustainabilityImpact && (
                                    <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                        <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                                            <span className="text-2xl">🌱</span>
                                            {dietPlan.sustainabilityImpact}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Nutrition Analysis */}
                            {dietPlan.nutritionAnalysis && (
                                <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Nutrition Analysis</h3>

                                    <div className="grid gap-4 md:grid-cols-5">
                                        {Object.entries(dietPlan.nutritionAnalysis).map(([key, data]) => (
                                            <div key={key} className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                                    {key}
                                                </p>
                                                <p className="text-2xl font-bold text-slate-900 mb-1">
                                                    {data.provided}
                                                    <span className="text-sm font-normal text-slate-600 ml-1">{data.unit}</span>
                                                </p>
                                                <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                                                    <div
                                                        className={`h-2 rounded-full ${data.provided >= data.recommended
                                                                ? 'bg-emerald-500'
                                                                : data.provided >= data.recommended * 0.7
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${Math.min((data.provided / data.recommended) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Goal: {data.recommended} {data.unit}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="mt-4 text-xs text-slate-400 italic text-center">
                                        *Nutritional values are approximate and based on standard dietary recommendations for an average adult (2000 kcal/day)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <SiteFooter />
            </div>
        </div>
    );
}
