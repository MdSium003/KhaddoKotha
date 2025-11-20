"use client";

import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { getUserInventory, UserInventoryItem, request } from "@/lib/api";

type DietPlanResponse = {
    breakfast: MealPlan;
    lunch: MealPlan;
    snacks: MealPlan;
    dinner: MealPlan;
};

type MealPlan = {
    name: string;
    ingredients: string[];
    instructions: string;
    nutritionInfo: string;
};

export default function DietPlanPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);

    // Preferences
    const [useInventory, setUseInventory] = useState(true);
    const [includeExternal, setIncludeExternal] = useState(false);
    const [dietaryRestrictions, setDietaryRestrictions] = useState("");
    const [calorieGoal, setCalorieGoal] = useState<"low" | "medium" | "high">("medium");
    const [mealPreference, setMealPreference] = useState<"vegetarian" | "non-vegetarian" | "vegan" | "any">("any");
    const [additionalComments, setAdditionalComments] = useState("");

    const [dietPlan, setDietPlan] = useState<DietPlanResponse | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadInventory();
        }
    }, [user]);

    const loadInventory = async () => {
        try {
            const items = await getUserInventory();
            setInventory(items);
        } catch (error) {
            console.error("Failed to load inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePlan = async () => {
        setError("");
        setAiLoading(true);
        setDietPlan(null);

        try {
            const inventoryItems = useInventory ? inventory.map(item => item.itemName) : [];

            const response = await request<DietPlanResponse>("/api/diet-plan", {
                method: "POST",
                body: JSON.stringify({
                    inventoryItems,
                    includeExternal,
                    dietaryRestrictions,
                    calorieGoal,
                    mealPreference,
                    additionalComments,
                }),
            });

            setDietPlan(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate diet plan");
            console.error("Failed to generate diet plan:", err);
        } finally {
            setAiLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#BCEBD7] flex items-center justify-center">
                <div className="text-slate-900 text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const MealCard = ({ title, meal, icon }: { title: string; meal: MealPlan; icon: string }) => (
        <div className="rounded-2xl border-2 border-white/60 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{icon}</span>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            </div>
            <h4 className="text-lg font-semibold text-emerald-600 mb-3">{meal.name}</h4>

            <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Ingredients:</p>
                <ul className="list-disc list-inside space-y-1">
                    {meal.ingredients.map((ingredient, index) => (
                        <li key={index} className="text-sm text-slate-600">{ingredient}</li>
                    ))}
                </ul>
            </div>

            <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Instructions:</p>
                <p className="text-sm text-slate-600 leading-relaxed">{meal.instructions}</p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Nutrition Info:</p>
                <p className="text-xs text-blue-900">{meal.nutritionInfo}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 pt-24">
                <SiteHeader />

                <main className="mt-10 flex flex-1 flex-col gap-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Diet Plan Generator</h1>
                            <p className="text-slate-600">Create personalized meal plans based on your preferences and inventory</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl bg-red-100 border border-red-300 p-4 flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Preferences Panel */}
                        <div className="lg:col-span-1">
                            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg sticky top-28">
                                <h2 className="text-xl font-bold text-slate-900 mb-6">Preferences</h2>

                                {/* Use Inventory */}
                                <div className="mb-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useInventory}
                                            onChange={(e) => setUseInventory(e.target.checked)}
                                            className="w-5 h-5 rounded border-2 border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-900">Use My Inventory</p>
                                            <p className="text-xs text-slate-500">Plan meals with items I already have ({inventory.length} items)</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Include External Items */}
                                <div className="mb-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeExternal}
                                            onChange={(e) => setIncludeExternal(e.target.checked)}
                                            className="w-5 h-5 rounded border-2 border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-900">Include External Items</p>
                                            <p className="text-xs text-slate-500">Suggest items not in my inventory</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Calorie Goal */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">Calorie Goal</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["low", "medium", "high"] as const).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setCalorieGoal(level)}
                                                className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all border-2 ${calorieGoal === level
                                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300"
                                                    }`}
                                            >
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {calorieGoal === "low" && "1200-1500 calories/day"}
                                        {calorieGoal === "medium" && "1500-2000 calories/day"}
                                        {calorieGoal === "high" && "2000-2500 calories/day"}
                                    </p>
                                </div>

                                {/* Meal Preference */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">Meal Preference</label>
                                    <select
                                        value={mealPreference}
                                        onChange={(e) => setMealPreference(e.target.value as any)}
                                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                    >
                                        <option value="any">Any</option>
                                        <option value="vegetarian">Vegetarian</option>
                                        <option value="vegan">Vegan</option>
                                        <option value="non-vegetarian">Non-Vegetarian</option>
                                    </select>
                                </div>

                                {/* Dietary Restrictions */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Restrictions</label>
                                    <input
                                        type="text"
                                        value={dietaryRestrictions}
                                        onChange={(e) => setDietaryRestrictions(e.target.value)}
                                        placeholder="e.g., No nuts, Gluten-free"
                                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                    />
                                </div>

                                {/* Additional Comments */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Comments</label>
                                    <textarea
                                        value={additionalComments}
                                        onChange={(e) => setAdditionalComments(e.target.value)}
                                        placeholder="Any specific requirements or preferences..."
                                        rows={4}
                                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
                                    />
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGeneratePlan}
                                    disabled={aiLoading}
                                    className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {aiLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </span>
                                    ) : (
                                        "Generate Diet Plan"
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Results Panel */}
                        <div className="lg:col-span-2">
                            {!dietPlan ? (
                                <div className="rounded-3xl border border-white/60 bg-white p-12 shadow-lg min-h-[600px] flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-4xl">
                                        🍽️
                                    </div>
                                    <h3 className="text-2xl font-semibold text-slate-900 mb-3">Ready to Plan Your Meals?</h3>
                                    <p className="text-slate-500 max-w-md mb-6">
                                        Set your preferences and click "Generate Diet Plan" to get a personalized meal plan for breakfast, lunch, snacks, and dinner.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-slate-600">AI-powered suggestions</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-slate-600">Nutrition information</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-slate-600">Detailed instructions</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-slate-600">Custom preferences</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
                                        <h2 className="text-2xl font-bold mb-2">Your Personalized Diet Plan</h2>
                                        <p className="text-emerald-100">Tailored to your preferences and nutritional goals</p>
                                    </div>

                                    <MealCard title="Breakfast" meal={dietPlan.breakfast} icon="🌅" />
                                    <MealCard title="Lunch" meal={dietPlan.lunch} icon="☀️" />
                                    <MealCard title="Snacks" meal={dietPlan.snacks} icon="🍪" />
                                    <MealCard title="Dinner" meal={dietPlan.dinner} icon="🌙" />

                                    <div className="flex justify-center pt-4">
                                        <button
                                            onClick={handleGeneratePlan}
                                            disabled={aiLoading}
                                            className="rounded-xl bg-white border-2 border-emerald-600 px-8 py-3 text-sm font-bold text-emerald-600 shadow-lg transition hover:bg-emerald-50 disabled:opacity-50"
                                        >
                                            🔄 Generate New Plan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <SiteFooter />
            </div>
        </div>
    );
}
