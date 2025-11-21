"use client";

import { useState, useEffect } from "react";

interface Alert {
    id: number;
    user_id: number;
    inventory_item_id: number;
    alert_type: "high_risk" | "expiring_soon" | "consume_now";
    risk_score: number;
    message: string;
    is_dismissed: boolean;
    created_at: string;
    item_name?: string;
    category?: string;
}

export default function AlertNotification({ userId }: { userId: number }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchAlerts();
        // Poll for new alerts every 5 minutes
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userId]);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alerts/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error("Error fetching alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    const dismissAlert = async (alertId: number) => {
        try {
            const token = localStorage.getItem("auth_token");
            await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alerts/${alertId}/dismiss`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            // Remove from local state
            setAlerts(alerts.filter((a) => a.id !== alertId));
        } catch (error) {
            console.error("Error dismissing alert:", error);
        }
    };

    const getAlertStyle = (type: string) => {
        switch (type) {
            case "consume_now":
                return {
                    bg: "bg-red-50 border-red-300",
                    text: "text-red-800",
                    icon: "🚨",
                    badge: "bg-red-600",
                };
            case "expiring_soon":
                return {
                    bg: "bg-orange-50 border-orange-300",
                    text: "text-orange-800",
                    icon: "⏰",
                    badge: "bg-orange-600",
                };
            case "high_risk":
                return {
                    bg: "bg-yellow-50 border-yellow-300",
                    text: "text-yellow-800",
                    icon: "⚡",
                    badge: "bg-yellow-600",
                };
            default:
                return {
                    bg: "bg-gray-50 border-gray-300",
                    text: "text-gray-800",
                    icon: "ℹ️",
                    badge: "bg-gray-600",
                };
        }
    };

    const getAlertPriority = (type: string) => {
        if (type === "consume_now") return 1;
        if (type === "expiring_soon") return 2;
        return 3;
    };

    const sortedAlerts = [...alerts].sort(
        (a, b) => getAlertPriority(a.alert_type) - getAlertPriority(b.alert_type)
    );

    const visibleAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, 3);

    if (loading) {
        return null;
    }

    if (alerts.length === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="font-semibold text-green-800">All Clear!</p>
                        <p className="text-sm text-green-700">
                            No high-risk items detected at the moment.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <span className="text-2xl">🔔</span>
                        {alerts.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {alerts.length}
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Active Alerts
                    </h3>
                </div>
                {alerts.length > 3 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        {showAll ? "Show Less" : `Show All (${alerts.length})`}
                    </button>
                )}
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {visibleAlerts.map((alert) => {
                    const style = getAlertStyle(alert.alert_type);
                    return (
                        <div
                            key={alert.id}
                            className={`${style.bg} border rounded-lg p-4 shadow-sm`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <span className="text-2xl">{style.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`${style.badge} text-white text-xs font-bold px-2 py-1 rounded uppercase`}
                                            >
                                                {alert.alert_type.replace("_", " ")}
                                            </span>
                                            {alert.item_name && (
                                                <span className="font-semibold text-gray-900">
                                                    {alert.item_name}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm ${style.text} font-medium`}>
                                            {alert.message}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                            <span>Risk Score: {alert.risk_score}/100</span>
                                            {alert.category && <span>Category: {alert.category}</span>}
                                            <span>
                                                {new Date(alert.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => dismissAlert(alert.id)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Dismiss alert"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                <div className="text-center">
                    <p className="text-xs text-gray-600">Urgent</p>
                    <p className="text-lg font-bold text-red-600">
                        {alerts.filter((a) => a.alert_type === "consume_now").length}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-600">Soon</p>
                    <p className="text-lg font-bold text-orange-600">
                        {alerts.filter((a) => a.alert_type === "expiring_soon").length}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-600">High Risk</p>
                    <p className="text-lg font-bold text-yellow-600">
                        {alerts.filter((a) => a.alert_type === "high_risk").length}
                    </p>
                </div>
            </div>
        </div>
    );
}
