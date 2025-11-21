"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";
import ExpirationRiskDashboard from "@/components/expiration-risk-dashboard";
import WasteAnalyticsPanel from "@/components/waste-analytics-panel";
import AlertNotification from "@/components/alert-notification";

export default function AnalyticsPage() {
    const [userId, setUserId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"risk" | "waste">("risk");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                const user = await getCurrentUser();
                setUserId(user.id);
            } catch (error) {
                console.error("Failed to get user:", error);
                setUserId(null);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Loading analytics...</p>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">Please log in to view analytics</p>
                    <a
                        href="/login"
                        className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        📊 AI Analytics Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Smart insights to reduce food waste and save money
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Alerts Section */}
                <div className="mb-8">
                    <AlertNotification userId={userId} />
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("risk")}
                            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === "risk"
                                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            <span className="text-xl mr-2">🎯</span>
                            Expiration Risk Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab("waste")}
                            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === "waste"
                                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            <span className="text-xl mr-2">♻️</span>
                            Waste Analytics & Insights
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "risk" ? (
                            <ExpirationRiskDashboard userId={userId} />
                        ) : (
                            <WasteAnalyticsPanel userId={userId} />
                        )}
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="text-3xl mb-3">🤖</div>
                        <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
                        <p className="text-sm text-gray-600">
                            Our AI analyzes consumption patterns, seasonality, and category risks to
                            provide accurate predictions.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="text-3xl mb-3">📈</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Real-Time Insights</h3>
                        <p className="text-sm text-gray-600">
                            Get instant feedback on your food management habits with weekly and
                            monthly projections.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="text-3xl mb-3">👥</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Community Driven</h3>
                        <p className="text-sm text-gray-600">
                            Compare your performance with community averages and learn from best
                            practices.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
