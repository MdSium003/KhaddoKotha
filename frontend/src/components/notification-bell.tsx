"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchNotifications, Notification } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasViewed, setHasViewed] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        async function loadNotifications() {
            try {
                const data = await fetchNotifications();
                setNotifications(data);
                // Reset hasViewed if new notifications appear
                if (data.length > 0 && !isOpen) {
                    setHasViewed(false);
                }
            } catch (error) {
                console.error("Failed to load notifications:", error);
            } finally {
                setLoading(false);
            }
        }

        loadNotifications();

        // Refresh notifications every 5 minutes
        const interval = setInterval(loadNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user, isOpen]);

    const handleTakeAction = (notification: Notification) => {
        const itemNames = notification.items.map(item => item.name).join(',');
        router.push(`/waste-to-asset?items=${encodeURIComponent(itemNames)}&autoGenerate=true`);
        setIsOpen(false);
    };

    const handleOpenDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Mark as viewed when opening the dropdown
            setHasViewed(true);
        }
    };

    if (!user || loading) {
        return null;
    }

    const notificationCount = notifications.length;
    const showBadge = notificationCount > 0 && !hasViewed;

    return (
        <div className="relative">
            <button
                onClick={handleOpenDropdown}
                className="relative p-2 text-stone-600 hover:text-orange-600 transition-colors"
            >
                {/* Bell Icon */}
                <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge */}
                {showBadge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Notification Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-20 max-h-[32rem] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Notifications</h3>
                            {notificationCount > 0 && (
                                <span className="text-xs text-slate-500">
                                    {notificationCount} {notificationCount === 1 ? 'alert' : 'alerts'}
                                </span>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <div className="text-4xl mb-2">🔔</div>
                                    <p className="text-sm">No notifications</p>
                                    <p className="text-xs mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className="p-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">
                                                    {notification.type === "expired" ? "❌" : "⚠️"}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-900 mb-1">
                                                        {notification.message}
                                                    </p>
                                                    <div className="text-xs text-slate-500 mb-2">
                                                        {notification.items.map((item, index) => (
                                                            <span key={item.id}>
                                                                {item.name}
                                                                {index < notification.items.length - 1 && ", "}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => handleTakeAction(notification)}
                                                        className="text-xs px-3 py-1.5 bg-[#714B67] text-white rounded-lg hover:bg-[#5d3d55] transition-all font-medium"
                                                    >
                                                        Take Action Now →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
