"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { generateDietPlan, type DietPlan, type MealItem } from "@/lib/api";

type MealPeriod = "breakfast" | "lunch" | "dinner";
type MealSourceFilter = "all" | "home" | "store";

const DEFAULT_WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SOURCE_FILTERS: Array<{ value: MealSourceFilter; label: string }> = [
    { value: "all", label: "All items" },
    { value: "home", label: "Home pantry" },
    { value: "store", label: "Store purchases" }
];

const PRIORITY_STYLES: Record<NonNullable<MealItem["priority"]>, { label: string; classes: string }> = {
    green: { label: "Use soon", classes: "bg-emerald-100 text-emerald-700" },
    yellow: { label: "Plan ahead", classes: "bg-amber-100 text-amber-700" },
    red: { label: "High priority", classes: "bg-rose-100 text-rose-700" }
};

function getPriorityBadge(priority?: MealItem["priority"]) {
    if (!priority) return null;
    const style = PRIORITY_STYLES[priority];
    if (!style) return null;
    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.classes}`}>
            {style.label}
        </span>
    );
}

export default function DietPlannerPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [dietBudget, setDietBudget] = useState(5);
    const [dietPreference, setDietPreference] = useState<"Veg" | "Non-Veg" | "Balanced">("Balanced");
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [dietLoading, setDietLoading] = useState(false);
    const [dietError, setDietError] = useState("");
    const [selectedDay, setSelectedDay] = useState("Monday");
    const [sourceFilter, setSourceFilter] = useState<MealSourceFilter>("all");

    useEffect(() => {
        if (!dietPlan?.weeklyMeals) {
            setSelectedDay("Monday");
            return;
        }
        const availableDays = Object.keys(dietPlan.weeklyMeals);
        if (!availableDays.length) {
            setSelectedDay("Monday");
            return;
        }
        if (!availableDays.includes(selectedDay)) {
            setSelectedDay(availableDays[0]);
        }
    }, [dietPlan, selectedDay]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const getMealsFor = (plan: DietPlan, mealType: MealPeriod) => {
        const items = plan.weeklyMeals
            ? plan.weeklyMeals[selectedDay]?.[mealType] ?? []
            : plan.meals?.[mealType] ?? [];

        if (sourceFilter === "all") {
            return items;
        }

        return items.filter((item) =>
            sourceFilter === "home" ? item.source === "Home" : item.source === "Store"
        );
    };

    const getCurrentMeals = (plan: DietPlan) => {
        if (plan.weeklyMeals) {
            return plan.weeklyMeals[selectedDay];
        }
        return plan.meals;
    };

    const getNutritionForDay = (plan: DietPlan) => {
        if (plan.dailyNutrition?.[selectedDay]) {
            return plan.dailyNutrition[selectedDay];
        }
        return plan.nutritionAnalysis;
    };

    const renderMealItems = (plan: DietPlan, mealType: MealPeriod) => {
        const meals = getMealsFor(plan, mealType);

        if (!meals.length) {
            return (
                <li className="bg-white/60 rounded-lg p-3 text-sm text-slate-500">
                    No meals match this filter.
                </li>
            );
        }

        return meals.map((item, i) => (
            <li key={`${mealType}-${i}`} className="bg-white/60 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 flex-1">{item.item}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {getPriorityBadge(item.priority)}
                        <span
                            className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.source === "Home"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-amber-200 text-amber-800"
                                }`}
                        >
                            {item.source === "Home" ? "🏠 Home" : `🛒 $${item.cost.toFixed(2)}`}
                        </span>
                    </div>
                </div>
                {item.note && (
                    <p className="text-xs text-slate-600 bg-slate-50/70 px-2 py-1 rounded border border-slate-200">
                        💡 {item.note}
                    </p>
                )}
                {item.substitute && (
                    <div className="text-xs text-slate-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                        🔁 Substitute: {item.substitute}
                    </div>
                )}
            </li>
        ));
    };

    const handleGenerateDietPlan = async () => {
        setDietError("");
        setDietLoading(true);
        setDietPlan(null);
        setSourceFilter("all");

        try {
            const plan = await generateDietPlan(dietBudget, dietPreference, "weekly");
            setDietPlan(plan);
            if (plan.weeklyMeals) {
                const days = Object.keys(plan.weeklyMeals);
                if (days.length) {
                    setSelectedDay(days.includes("Monday") ? "Monday" : days[0]);
                }
            }
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
                    <div className="rounded-3xl border-2 border-white/80 bg-white/95 backdrop-blur-sm p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Plan Settings</h2>
                                <p className="text-sm text-slate-500">Customize your meal plan preferences</p>
                            </div>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 mb-8">
                            {/* Daily Budget */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700">
                                    Daily Budget ($)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-400 text-lg font-semibold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.5"
                                        value={dietBudget}
                                        onChange={(e) => setDietBudget(parseFloat(e.target.value) || 0)}
                                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3.5 text-lg text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Set your daily food budget
                                </p>
                            </div>

                            {/* Meal Preference */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700">
                                    Meal Preference
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {([
                                        { value: "Veg", icon: "🥗", color: "from-green-500 to-emerald-500" },
                                        { value: "Non-Veg", icon: "🍗", color: "from-orange-500 to-red-500" },
                                        { value: "Balanced", icon: "⚖️", color: "from-emerald-500 to-teal-500" }
                                    ] as const).map((pref) => (
                                        <button
                                            key={pref.value}
                                            onClick={() => setDietPreference(pref.value)}
                                            className={`relative py-4 px-3 rounded-xl font-bold transition-all border-2 overflow-hidden group ${dietPreference === pref.value
                                                ? `bg-gradient-to-br ${pref.color} border-transparent text-white shadow-lg scale-105`
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xl">{pref.icon}</span>
                                                <span className="text-xs">{pref.value}</span>
                                            </div>
                                            {dietPreference === pref.value && (
                                                <div className="absolute top-1 right-1">
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateDietPlan}
                            disabled={dietLoading || dietBudget <= 0}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                        >
                            {dietLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Your Meal Plan...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Generate Meal Plan
                                </span>
                            )}
                        </button>

                        {dietError && (
                            <div className="mt-6 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="p-2 bg-red-200 rounded-lg">
                                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-red-800 font-semibold mb-1">Error</p>
                                    <p className="text-sm text-red-700">{dietError}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    {dietPlan && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {dietPlan.planComment && (
                                <div className="rounded-3xl border border-emerald-100 bg-white/70 backdrop-blur-sm p-6 shadow-md">
                                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Weekly focus</p>
                                    <p className="text-lg text-slate-800 mt-2">{dietPlan.planComment}</p>
                                </div>
                            )}

                            {dietPlan.weeklyMeals && (
                                <div className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur-sm p-5 shadow-lg space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Weekly plan</p>
                                            <h3 className="text-2xl font-bold text-slate-900">Select a day to view meals</h3>
                                        </div>
                                        <span className="text-sm font-medium text-emerald-600">Budget capped per day</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            const days = Object.keys(dietPlan.weeklyMeals ?? {});
                                            const ordered = [
                                                ...DEFAULT_WEEK_DAYS.filter((day) => days.includes(day)),
                                                ...days.filter((day) => !DEFAULT_WEEK_DAYS.includes(day))
                                            ];
                                            return ordered.map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => setSelectedDay(day)}
                                                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${selectedDay === day
                                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200"
                                                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {SOURCE_FILTERS.map((filter) => (
                                            <button
                                                key={filter.value}
                                                onClick={() => setSourceFilter(filter.value)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${sourceFilter === filter.value
                                                    ? "bg-slate-900 text-white border-slate-900"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                                                    }`}
                                            >
                                                {filter.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {dietPlan.weeklyMeals?.[selectedDay]?.comment && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
                                    <div className="text-2xl">🗓️</div>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-700">{selectedDay} focus</p>
                                        <p className="text-sm text-emerald-900">{dietPlan.weeklyMeals[selectedDay]?.comment}</p>
                                    </div>
                                </div>
                            )}

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
                                        <h3 className="text-xl font-bold text-orange-900">
                                            Breakfast {dietPlan.weeklyMeals && `- ${selectedDay}`}
                                        </h3>
                                    </div>
                                    <ul className="space-y-3">{renderMealItems(dietPlan, "breakfast")}</ul>
                                </div>

                                {/* Lunch */}
                                <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-emerald-200 rounded-xl">
                                            <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-emerald-900">
                                            Lunch {dietPlan.weeklyMeals && `- ${selectedDay}`}
                                        </h3>
                                    </div>
                                    <ul className="space-y-3">{renderMealItems(dietPlan, "lunch")}</ul>
                                </div>

                                {/* Dinner */}
                                <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-purple-200 rounded-xl">
                                            <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-purple-900">
                                            Dinner {dietPlan.weeklyMeals && `- ${selectedDay}`}
                                        </h3>
                                    </div>
                                    <ul className="space-y-3">{renderMealItems(dietPlan, "dinner")}</ul>
                                </div>
                            </div>

                            {/* Alternatives Section */}
                            {(() => {
                                const currentMeals = getCurrentMeals(dietPlan);
                                const alternatives = currentMeals?.alternatives;
                                const hasAlternatives = alternatives && (
                                    (alternatives.breakfast && alternatives.breakfast.length > 0) ||
                                    (alternatives.lunch && alternatives.lunch.length > 0) ||
                                    (alternatives.dinner && alternatives.dinner.length > 0)
                                );

                                if (!hasAlternatives) {
                                    return null;
                                }

                                return (
                                    <div className="rounded-3xl border-2 border-white/80 bg-white/95 backdrop-blur-sm p-6 shadow-2xl">
                                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <span>🔄</span>
                                            Alternative Meal Ideas {dietPlan.weeklyMeals && `- ${selectedDay}`}
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            {alternatives?.breakfast && alternatives.breakfast.length > 0 && (
                                                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                                                    <h4 className="font-bold text-orange-900 mb-2 text-sm">Breakfast Alternatives</h4>
                                                    <ul className="space-y-1">
                                                        {alternatives.breakfast.map((alt, i) => (
                                                            <li key={i} className="text-sm text-orange-800">• {alt}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {alternatives?.lunch && alternatives.lunch.length > 0 && (
                                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                                    <h4 className="font-bold text-emerald-900 mb-2 text-sm">Lunch Alternatives</h4>
                                                    <ul className="space-y-1">
                                                        {alternatives.lunch.map((alt, i) => (
                                                            <li key={i} className="text-sm text-emerald-800">• {alt}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {alternatives?.dinner && alternatives.dinner.length > 0 && (
                                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                                    <h4 className="font-bold text-purple-900 mb-2 text-sm">Dinner Alternatives</h4>
                                                    <ul className="space-y-1">
                                                        {alternatives.dinner.map((alt, i) => (
                                                            <li key={i} className="text-sm text-purple-800">• {alt}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Plan Summary */}
                            <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                                <h3 className="text-2xl font-bold text-slate-900 mb-6">Plan Summary</h3>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <span className="font-semibold text-slate-700">Total Cost:</span>
                                            <span className={`text-2xl font-bold ${dietPlan.totalCost <= dietBudget ? "text-emerald-600" : "text-red-600"
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
                            {(() => {
                                const nutrition = getNutritionForDay(dietPlan);
                                if (!nutrition) {
                                    return null;
                                }
                                return (
                                    <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-6">
                                            Nutrition Analysis {dietPlan.weeklyMeals && `- ${selectedDay}`}
                                        </h3>

                                        <div className="grid gap-4 md:grid-cols-5">
                                            {Object.entries(nutrition).map(([key, data]) => (
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
                                                                ? "bg-emerald-500"
                                                                : data.provided >= data.recommended * 0.7
                                                                    ? "bg-yellow-500"
                                                                    : "bg-red-500"
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
                                );
                            })()}
                        </div>
                    )}
                </main>

                <SiteFooter />
            </div>
        </div>
    );
}
