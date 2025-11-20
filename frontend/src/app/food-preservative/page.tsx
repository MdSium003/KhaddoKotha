"use client";

import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useEffect, useState } from "react";
import { getUserInventory, UserInventoryItem } from "@/lib/api";

// Static preservation data to map against user inventory
const preservationDatabase: Record<string, { normalLife: string; preservative: string; extendedLife: string; chemical: string }> = {
    // Fruits
    "tomatoes": { normalLife: "5-7 days", preservative: "Refrigeration", extendedLife: "2 weeks", chemical: "Citric Acid / Calcium Chloride" },
    "apples": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1-2 months", chemical: "Ascorbic Acid (Vitamin C)" },
    "banana": { normalLife: "3-5 days", preservative: "Cool, Dry Place", extendedLife: "1 week", chemical: "Ethylene Absorbents" },
    "orange": { normalLife: "2-3 weeks", preservative: "Refrigeration", extendedLife: "1-2 months", chemical: "Diphenyl / Orthophenylphenol" },
    "strawberries": { normalLife: "2-3 days", preservative: "Vinegar Wash & Refrigeration", extendedLife: "1 week", chemical: "Potassium Sorbate" },
    "mango": { normalLife: "5-7 days", preservative: "Refrigeration (Ripe)", extendedLife: "2 weeks", chemical: "Hot Water Treatment" },
    "grape": { normalLife: "1 week", preservative: "Refrigeration", extendedLife: "2-3 weeks", chemical: "Sulfur Dioxide Pads" },

    // Vegetables
    "potatoes": { normalLife: "3-5 weeks", preservative: "Cool, Dark Place", extendedLife: "4-6 months", chemical: "Chlorpropham (Sprout Inhibitor)" },
    "onions": { normalLife: "1-2 months", preservative: "Cool, Dry Place", extendedLife: "6-8 months", chemical: "Maleic Hydrazide" },
    "carrot": { normalLife: "2-3 weeks", preservative: "Refrigeration (in water)", extendedLife: "1 month", chemical: "Chlorine Wash" },
    "spinach": { normalLife: "3-5 days", preservative: "Refrigeration", extendedLife: "1 week", chemical: "Ascorbic Acid Wash" },

    // Dairy
    "milk": { normalLife: "5-7 days", preservative: "Pasteurization & Refrigeration", extendedLife: "10-14 days", chemical: "Sodium Benzoate / Nisin" },
    "cheese": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1-2 months", chemical: "Natamycin (Anti-fungal)" },
    "yogurt": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1 month", chemical: "Potassium Sorbate" },

    // Proteins
    "eggs": { normalLife: "3-5 weeks", preservative: "Refrigeration", extendedLife: "3-5 weeks", chemical: "Mineral Oil Coating" },
    "chicken": { normalLife: "1-2 days", preservative: "Freezing", extendedLife: "9 months", chemical: "Sodium Lactate" },
    "salmon": { normalLife: "1-2 days", preservative: "Freezing", extendedLife: "6 months", chemical: "Sodium Nitrite (Smoked)" },
    "beef": { normalLife: "3-5 days", preservative: "Freezing", extendedLife: "6-12 months", chemical: "Sodium Ascorbate" },

    // Grains
    "bread": { normalLife: "3-5 days", preservative: "Freezing", extendedLife: "3 months", chemical: "Calcium Propionate" },
    "rice": { normalLife: "1-2 years", preservative: "Airtight Container", extendedLife: "30 years", chemical: "Oxygen Absorbers" },
    "pasta": { normalLife: "1-2 years", preservative: "Airtight Container", extendedLife: "3 years", chemical: "None" },
};

export default function FoodPreservativePage() {
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadInventory() {
            try {
                const items = await getUserInventory();
                setInventory(items);
            } catch (error) {
                console.error("Failed to load inventory:", error);
            } finally {
                setLoading(false);
            }
        }

        loadInventory();
    }, []);

    const getPreservationInfo = (itemName: string) => {
        const lowerName = itemName.toLowerCase();
        if (preservationDatabase[lowerName]) {
            return preservationDatabase[lowerName];
        }

        for (const [key, value] of Object.entries(preservationDatabase)) {
            if (lowerName.includes(key) || key.includes(lowerName)) {
                return value;
            }
        }

        return {
            normalLife: "N/A",
            preservative: "General Storage",
            extendedLife: "N/A",
            chemical: "None"
        };
    };

    const calculateDates = (item: UserInventoryItem, info: any) => {
        let normalDisplay = info.normalLife;
        let extendedDisplay = info.extendedLife;
        let isExpired = false;

        if (item.expirationDate) {
            const expDate = new Date(item.expirationDate);
            const today = new Date();
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                normalDisplay = `Expired ${Math.abs(diffDays)} days ago`;
                isExpired = true;
            } else if (diffDays === 0) {
                normalDisplay = "Expires today";
                isExpired = true;
            } else {
                normalDisplay = `Expires in ${diffDays} days`;
            }
        }

        return { normalDisplay, extendedDisplay, isExpired };
    };

    // Filter inventory based on search
    const filteredInventory = inventory.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const totalItems = filteredInventory.length;
    const expiringSoon = filteredInventory.filter(item => {
        if (!item.expirationDate) return false;
        const diffDays = Math.ceil((new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;
    const expired = filteredInventory.filter(item => {
        if (!item.expirationDate) return false;
        return new Date(item.expirationDate) < new Date();
    }).length;

    return (
        <div className="min-h-screen bg-[#BCEBD7] text-slate-900 font-sans">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8 pt-24">
                <SiteHeader />

                <main className="flex-1 py-12">
                    <div className="w-full mx-auto">
                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">Food Preservation Guide</h1>
                                <p className="text-slate-600">Extend shelf life with proper preservation techniques</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-700">Total Items</p>
                                        <p className="text-3xl font-bold text-blue-900 mt-1">{totalItems}</p>
                                    </div>
                                    <div className="p-3 bg-blue-200 rounded-xl">
                                        <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-orange-700">Expiring Soon</p>
                                        <p className="text-3xl font-bold text-orange-900 mt-1">{expiringSoon}</p>
                                    </div>
                                    <div className="p-3 bg-orange-200 rounded-xl">
                                        <svg className="w-8 h-8 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-700">Expired</p>
                                        <p className="text-3xl font-bold text-red-900 mt-1">{expired}</p>
                                    </div>
                                    <div className="p-3 bg-red-200 rounded-xl">
                                        <svg className="w-8 h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-lg mb-6">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search your inventory..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {/* Items Grid */}
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                                <p className="text-slate-600">Loading your inventory...</p>
                            </div>
                        ) : filteredInventory.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No items found</h3>
                                <p className="text-slate-500">
                                    {inventory.length === 0
                                        ? "Add items to your inventory to see preservation tips"
                                        : "No items match your search"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredInventory.map((item) => {
                                    const info = getPreservationInfo(item.itemName);
                                    const { normalDisplay, extendedDisplay, isExpired } = calculateDates(item, info);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`rounded-2xl border-2 bg-white p-6 shadow-lg transition-all hover:shadow-xl ${isExpired ? 'border-red-300' : 'border-white/60'
                                                }`}
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-slate-900">{item.itemName}</h3>
                                                    <p className="text-sm text-slate-500 capitalize">{item.category}</p>
                                                </div>
                                                {isExpired && (
                                                    <div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                                        EXPIRED
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className={`rounded-xl p-4 mb-4 ${isExpired ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg className={`w-5 h-5 ${isExpired ? 'text-red-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className={`text-sm font-semibold ${isExpired ? 'text-red-700' : 'text-emerald-700'}`}>Current Status</p>
                                                </div>
                                                <p className={`text-sm ${isExpired ? 'text-red-900' : 'text-emerald-900'} font-medium`}>{normalDisplay}</p>
                                            </div>

                                            {/* Preservation Method */}
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</p>
                                                        <p className="text-sm font-medium text-slate-900">{info.preservative}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg mt-0.5">
                                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Additive</p>
                                                        <p className="text-sm font-medium text-slate-900">{info.chemical}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-emerald-100 rounded-lg mt-0.5">
                                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Extended Life</p>
                                                        <p className="text-sm font-bold text-emerald-600">{extendedDisplay}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                <SiteFooter />
            </div>
        </div>
    );
}
