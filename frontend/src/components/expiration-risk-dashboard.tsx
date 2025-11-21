"use client";

import { useState, useEffect } from "react";

interface RiskScore {
    id: number;
    inventory_item_id: number;
    risk_score: number;
    priority_rank?: number;
    consumption_frequency?: number;
    category_risk_factor: number;
    seasonal_factor: number;
    explanation: string;
    days_until_expiry?: number;
    item_name: string;
    category: string;
    quantity: number;
    expiration_date?: string;
}

interface PrioritizedItem {
    inventory_item_id: number;
    item_name: string;
    category: string;
    quantity: number;
    expiration_date?: string;
    priority_score: number;
    priority_rank: number;
    risk_score: number;
    days_until_expiry?: number;
    recommendation: string;
}

export default function ExpirationRiskDashboard({ userId }: { userId: number }) {
    const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
    const [prioritized, setPrioritized] = useState<PrioritizedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [view, setView] = useState<"scores" | "priority">("priority");

    useEffect(() => {
        fetchRiskData();
    }, [userId]);

    const fetchRiskData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");

            // Fetch risk scores
            const scoresRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/risk/inventory/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const scoresData = await scoresRes.json();
            setRiskScores(scoresData.riskScores || []);

            // Fetch prioritized list
            const priorityRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/risk/prioritized/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const priorityData = await priorityRes.json();
            setPrioritized(priorityData.prioritizedItems || []);
        } catch (error) {
            console.error("Error fetching risk data:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateRisks = async () => {
        setCalculating(true);
        try {
            const token = localStorage.getItem("auth_token");
            await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/risk/calculate/${userId}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            await fetchRiskData();
        } catch (error) {
            console.error("Error calculating risks:", error);
        } finally {
            setCalculating(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 80) return "bg-red-100 border-red-300 text-red-800";
        if (score >= 60) return "bg-orange-100 border-orange-300 text-orange-800";
        if (score >= 40) return "bg-yellow-100 border-yellow-300 text-yellow-800";
        return "bg-green-100 border-green-300 text-green-800";
    };

    const getRiskBadge = (score: number) => {
        if (score >= 80) return { label: "HIGH RISK", color: "bg-red-500" };
        if (score >= 60) return { label: "MEDIUM", color: "bg-orange-500" };
        if (score >= 40) return { label: "LOW-MEDIUM", color: "bg-yellow-500" };
        return { label: "LOW RISK", color: "bg-green-500" };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading risk analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        🎯 Expiration Risk Analysis
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        AI-powered insights to minimize food waste
                    </p>
                </div>
                <button
                    onClick={calculateRisks}
                    disabled={calculating}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {calculating ? "Calculating..." : "🔄 Recalculate Risks"}
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{riskScores.length}</p>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                    <p className="text-sm text-red-600">High Risk</p>
                    <p className="text-2xl font-bold text-red-700">
                        {riskScores.filter((s) => s.risk_score >= 80).length}
                    </p>
                </div>
                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <p className="text-sm text-orange-600">Medium Risk</p>
                    <p className="text-2xl font-bold text-orange-700">
                        {riskScores.filter((s) => s.risk_score >= 60 && s.risk_score < 80).length}
                    </p>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <p className="text-sm text-green-600">Low Risk</p>
                    <p className="text-2xl font-bold text-green-700">
                        {riskScores.filter((s) => s.risk_score < 60).length}
                    </p>
                </div>
            </div>

            {/* Charts Section */}
            {riskScores.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Distribution Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            📊 Risk Score Distribution
                        </h3>
                        <div className="h-64">
                            {(() => {
                                const categories: Record<string, number> = {};
                                riskScores.forEach((score) => {
                                    if (!categories[score.category]) {
                                        categories[score.category] = 0;
                                    }
                                    categories[score.category] += score.risk_score;
                                });

                                const chartData = Object.keys(categories).map((cat) => ({
                                    category: cat,
                                    avgRisk: Math.round(categories[cat] / riskScores.filter(s => s.category === cat).length),
                                }));

                                const maxRisk = Math.max(...chartData.map(d => d.avgRisk));

                                return (
                                    <div className="space-y-3">
                                        {chartData.map((data) => {
                                            const percentage = (data.avgRisk / maxRisk) * 100;
                                            const color = data.avgRisk >= 80 ? "bg-red-500" :
                                                data.avgRisk >= 60 ? "bg-orange-500" :
                                                    data.avgRisk >= 40 ? "bg-yellow-500" : "bg-green-500";

                                            return (
                                                <div key={data.category} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-gray-700">{data.category}</span>
                                                        <span className="text-gray-600">{data.avgRisk}/100</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                                        <div
                                                            className={`${color} h-3 rounded-full transition-all duration-500`}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Category Breakdown Pie Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            🥧 Items by Category
                        </h3>
                        <div className="h-64 flex items-center justify-center">
                            {(() => {
                                const categoryCount: Record<string, number> = {};
                                riskScores.forEach((score) => {
                                    if (!categoryCount[score.category]) {
                                        categoryCount[score.category] = 0;
                                    }
                                    categoryCount[score.category]++;
                                });

                                const total = riskScores.length;
                                const colors = [
                                    "bg-blue-500",
                                    "bg-green-500",
                                    "bg-yellow-500",
                                    "bg-red-500",
                                    "bg-purple-500",
                                    "bg-pink-500",
                                    "bg-indigo-500",
                                    "bg-orange-500",
                                ];

                                return (
                                    <div className="w-full space-y-2">
                                        {Object.entries(categoryCount).map(([category, count], index) => {
                                            const percentage = Math.round((count / total) * 100);
                                            return (
                                                <div key={category} className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
                                                    <span className="text-sm font-medium text-gray-700 flex-1">{category}</span>
                                                    <span className="text-sm text-gray-600">{count} items</span>
                                                    <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setView("priority")}
                    className={`px-4 py-2 font-medium transition-colors ${view === "priority"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    📋 Priority List (FIFO + AI)
                </button>
                <button
                    onClick={() => setView("scores")}
                    className={`px-4 py-2 font-medium transition-colors ${view === "scores"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    📊 All Risk Scores
                </button>
            </div>

            {/* Priority List View */}
            {view === "priority" && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                        Items ranked by urgency (combining expiration dates + AI risk analysis)
                    </p>
                    {prioritized.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-600">No items to prioritize yet.</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Add items to your inventory to see priority rankings.
                            </p>
                        </div>
                    ) : (
                        prioritized.slice(0, 10).map((item) => {
                            const badge = getRiskBadge(item.risk_score);
                            return (
                                <div
                                    key={item.inventory_item_id}
                                    className={`p-4 rounded-lg border-2 ${getRiskColor(item.risk_score)}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xl font-bold text-gray-700">
                                                    #{item.priority_rank}
                                                </span>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {item.item_name}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-2">
                                                <span>📦 {item.quantity} units</span>
                                                <span>🏷️ {item.category}</span>
                                                {item.days_until_expiry !== undefined && (
                                                    <span>
                                                        ⏰ {item.days_until_expiry} days left
                                                    </span>
                                                )}
                                                <span>🎯 Priority: {item.priority_score}/100</span>
                                            </div>
                                            <p className="text-sm font-medium">
                                                {item.recommendation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Risk Scores View */}
            {view === "scores" && (
                <div className="space-y-3">
                    {riskScores.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-600">No risk scores available.</p>
                            <button
                                onClick={calculateRisks}
                                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                Calculate Risk Scores
                            </button>
                        </div>
                    ) : (
                        riskScores.map((score) => {
                            const badge = getRiskBadge(score.risk_score);
                            return (
                                <div
                                    key={score.id}
                                    className={`p-4 rounded-lg border ${getRiskColor(score.risk_score)}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {score.item_name}
                                            </h3>
                                            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-700">
                                                <span>📦 {score.quantity} units</span>
                                                <span>🏷️ {score.category}</span>
                                                {score.days_until_expiry !== undefined && (
                                                    <span>⏰ Expires in {score.days_until_expiry} days</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${badge.color}`}>
                                                {badge.label}
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                                {score.risk_score}
                                            </div>
                                            <div className="text-xs text-gray-600">Risk Score</div>
                                        </div>
                                    </div>

                                    {/* AI Explanation */}
                                    <div className="mt-3 p-3 bg-white/50 rounded border border-gray-200">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">💡 AI Analysis:</span>{" "}
                                            {score.explanation}
                                        </p>
                                    </div>

                                    {/* Technical Details */}
                                    <details className="mt-2">
                                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                                            Show technical details
                                        </summary>
                                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                                            <div>
                                                <span className="font-semibold">Consumption:</span>{" "}
                                                {Number(score.consumption_frequency || 0).toFixed(1)}x/week
                                            </div>
                                            <div>
                                                <span className="font-semibold">Category Factor:</span>{" "}
                                                {Number(score.category_risk_factor || 0).toFixed(2)}x
                                            </div>
                                            <div>
                                                <span className="font-semibold">Seasonal Factor:</span>{" "}
                                                {Number(score.seasonal_factor || 0).toFixed(2)}x
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
