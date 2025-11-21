"use client";

import { useState, useEffect } from "react";

interface WasteEstimate {
    estimated_grams: number;
    estimated_cost: number;
    confidence_score: number;
    breakdown_by_category: CategoryWaste[];
}

interface CategoryWaste {
    category: string;
    estimated_grams: number;
    estimated_cost: number;
    [key: string]: any;
}

interface WasteProjection {
    estimate_type: "weekly" | "monthly";
    estimated_grams: number;
    estimated_cost: number;
    confidence_score: number;
    projection_date: string;
}

interface CommunityComparison {
    user_waste_grams_weekly: number;
    user_waste_cost_weekly: number;
    community_avg_grams_weekly: number;
    community_avg_cost_weekly: number;
    percentile: number;
    comparison_message: string;
    category_comparisons: CategoryComparison[];
}

interface CategoryComparison {
    category: string;
    user_grams: number;
    community_avg: number;
    performance: "better" | "average" | "worse";
}

interface AIInsight {
    insight_type: string;
    title: string;
    description: string;
    action_items: string[];
}

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface HistoricalWaste {
    total_grams: number;
    total_cost: number;
}



export default function WasteAnalyticsPanel({ userId }: { userId: number }) {
    const [estimate, setEstimate] = useState<WasteEstimate | null>(null);
    const [historical, setHistorical] = useState<HistoricalWaste | null>(null);
    const [projections, setProjections] = useState<{ weekly: WasteProjection; monthly: WasteProjection } | null>(null);
    const [comparison, setComparison] = useState<CommunityComparison | null>(null);
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWasteData();
    }, [userId]);

    const fetchWasteData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch current estimate and historical stats
            const estimateRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/waste/estimate/${userId}`,
                { headers }
            );
            const estimateData = await estimateRes.json();
            setEstimate(estimateData.estimate);
            setHistorical(estimateData.historical);

            // Fetch projections
            const projectionsRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/waste/projections/${userId}`,
                { headers }
            );
            const projectionsData = await projectionsRes.json();
            setProjections(projectionsData);

            // Fetch community comparison
            const comparisonRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/waste/community-compare/${userId}`,
                { headers }
            );
            const comparisonData = await comparisonRes.json();
            setComparison(comparisonData.comparison);

            // Fetch insights
            const insightsRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/waste/insights/${userId}`,
                { headers }
            );
            const insightsData = await insightsRes.json();
            setInsights(insightsData.insights || []);
        } catch (error) {
            console.error("Error fetching waste data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getPerformanceColor = (performance: string) => {
        if (performance === "better") return "text-green-600 bg-green-50 border-green-200";
        if (performance === "worse") return "text-red-600 bg-red-50 border-red-200";
        return "text-gray-600 bg-gray-50 border-gray-200";
    };

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

    const getPerformanceIcon = (performance: string) => {
        if (performance === "better") return "✅";
        if (performance === "worse") return "⚠️";
        return "➖";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading waste analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    ♻️ Waste Analytics & Insights
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    AI-powered waste estimation and reduction strategies
                </p>
            </div>

            {/* Historical Waste (Already Wasted) */}
            {historical && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        🗑️ Already Wasted (Historical)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600">Total Waste Recorded</p>
                            <p className="text-3xl font-bold text-gray-700">
                                {historical.total_grams}g
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600">Total Cost Wasted</p>
                            <p className="text-3xl font-bold text-gray-700">
                                ${historical.total_cost.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Estimate & Charts */}
            {estimate && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📊 Current Waste Estimate
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                            <p className="text-sm text-gray-600">Estimated Waste</p>
                            <p className="text-3xl font-bold text-orange-600">
                                {Math.round(Number(estimate.estimated_grams))}g
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-red-200">
                            <p className="text-sm text-gray-600">Money at Risk</p>
                            <p className="text-3xl font-bold text-red-600">
                                ${Number(estimate.estimated_cost).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-gray-600">Confidence</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {estimate.confidence_score}%
                            </p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart: Waste by Category */}
                        {estimate.breakdown_by_category.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">
                                    Waste by Category
                                </h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={estimate.breakdown_by_category}
                                                dataKey="estimated_grams"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                            >
                                                {estimate.breakdown_by_category.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => [`${Math.round(value)}g`, 'Waste']} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Bar Chart: Cost Breakdown */}
                        {estimate.breakdown_by_category.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">
                                    Cost at Risk by Category
                                </h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={estimate.breakdown_by_category}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="category" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <Tooltip formatter={(value: number) => [`$${Number(value).toFixed(2)}`, 'Cost']} />
                                            <Bar dataKey="estimated_cost" fill="#ff8042" name="Cost ($)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Projections */}
            {projections && projections.weekly && projections.monthly && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            📅 Weekly Projection
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Next 7 Days</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {Math.round(Number(projections.weekly.estimated_grams))}g
                                </p>
                                <p className="text-sm text-gray-500">
                                    ~${Number(projections.weekly.estimated_cost).toFixed(2)} at risk
                                </p>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600">
                                    Confidence: {projections.weekly.confidence_score}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            📆 Monthly Projection
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Next 30 Days</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {Math.round(Number(projections.monthly.estimated_grams))}g
                                </p>
                                <p className="text-sm text-gray-500">
                                    ~${Number(projections.monthly.estimated_cost).toFixed(2)} at risk
                                </p>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600">
                                    Confidence: {projections.monthly.confidence_score}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Community Comparison */}
            {comparison && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        👥 Community Comparison
                    </h3>

                    {/* Percentile */}
                    <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <p className="text-sm text-gray-700 mb-2">Your Performance</p>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-bold text-emerald-600">
                                {comparison.percentile}th
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {comparison.comparison_message}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600">Your Waste (Weekly)</p>
                            <p className="text-xl font-bold text-gray-900">
                                {Math.round(Number(comparison.user_waste_grams_weekly))}g
                            </p>
                            <p className="text-xs text-gray-500">
                                ${Number(comparison.user_waste_cost_weekly).toFixed(2)}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600">Community Average</p>
                            <p className="text-xl font-bold text-gray-900">
                                {Math.round(Number(comparison.community_avg_grams_weekly))}g
                            </p>
                            <p className="text-xs text-gray-500">
                                ${Number(comparison.community_avg_cost_weekly).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Category Performance */}
                    {comparison.category_comparisons.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Performance by Category
                            </h4>
                            <div className="space-y-2">
                                {comparison.category_comparisons.map((cat) => (
                                    <div
                                        key={cat.category}
                                        className={`p-3 rounded-lg border ${getPerformanceColor(cat.performance)}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-semibold">{cat.category}</span>
                                                <p className="text-xs mt-1">
                                                    You: {cat.user_grams}g | Avg: {cat.community_avg}g
                                                </p>
                                            </div>
                                            <div className="text-2xl">
                                                {getPerformanceIcon(cat.performance)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AI Insights */}
            {insights.length > 0 && (
                <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-4">
                        🤖 AI Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                                <h4 className="font-semibold text-indigo-800 mb-2">
                                    {insight.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    {insight.description}
                                </p>
                                <ul className="space-y-1">
                                    {insight.action_items.map((item, i) => (
                                        <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                            <span className="text-indigo-500 mt-0.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
