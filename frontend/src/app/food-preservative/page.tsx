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
    "pineapple": { normalLife: "3-5 days", preservative: "Refrigeration", extendedLife: "1 week", chemical: "Wax Coating" },
    "grapes": { normalLife: "1 week", preservative: "Refrigeration", extendedLife: "2-3 weeks", chemical: "Sulfur Dioxide Pads" },
    "kiwi": { normalLife: "1 week", preservative: "Refrigeration", extendedLife: "2-3 weeks", chemical: "1-MCP (SmartFresh)" },
    "blueberry": { normalLife: "1 week", preservative: "Refrigeration", extendedLife: "2 weeks", chemical: "Sodium Benzoate" },
    "avocado": { normalLife: "3-4 days", preservative: "Refrigeration (Ripe)", extendedLife: "1 week", chemical: "Citric Acid (prevents browning)" },
    "coconut": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1 month", chemical: "Sodium Metabisulfite" },

    // Vegetables
    "potatoes": { normalLife: "3-5 weeks", preservative: "Cool, Dark Place", extendedLife: "4-6 months", chemical: "Chlorpropham (Sprout Inhibitor)" },
    "onions": { normalLife: "1-2 months", preservative: "Cool, Dry Place", extendedLife: "6-8 months", chemical: "Maleic Hydrazide" },
    "carrot": { normalLife: "2-3 weeks", preservative: "Refrigeration (in water)", extendedLife: "1 month", chemical: "Chlorine Wash" },
    "spinach": { normalLife: "3-5 days", preservative: "Refrigeration", extendedLife: "1 week", chemical: "Ascorbic Acid Wash" },
    "cucumber": { normalLife: "1 week", preservative: "Refrigeration", extendedLife: "2 weeks", chemical: "Edible Wax Coating" },
    "lettuce": { normalLife: "1 week", preservative: "Refrigeration", extendedLife: "2 weeks", chemical: "Modified Atmosphere Packaging" },
    "cabbage": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1-2 months", chemical: "Lactic Acid (Sauerkraut)" },

    // Dairy
    "milk": { normalLife: "5-7 days", preservative: "Pasteurization & Refrigeration", extendedLife: "10-14 days", chemical: "Sodium Benzoate / Nisin" },
    "cheese": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1-2 months", chemical: "Natamycin (Anti-fungal)" },
    "yogurt": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1 month", chemical: "Potassium Sorbate" },
    "butter": { normalLife: "1-2 months", preservative: "Refrigeration", extendedLife: "6-9 months (Frozen)", chemical: "Salt (Natural Preservative)" },
    "cheddar cheese": { normalLife: "2-4 weeks", preservative: "Refrigeration", extendedLife: "3-6 months", chemical: "Sorbic Acid" },
    "mozzarella": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1 month", chemical: "Calcium Chloride" },

    // Proteins
    "eggs": { normalLife: "3-5 weeks", preservative: "Refrigeration", extendedLife: "3-5 weeks", chemical: "Mineral Oil Coating" },
    "chicken breast": { normalLife: "1-2 days", preservative: "Freezing", extendedLife: "9 months", chemical: "Sodium Lactate" },
    "salmon": { normalLife: "1-2 days", preservative: "Freezing", extendedLife: "6 months", chemical: "Sodium Nitrite (Smoked)" },
    "beef": { normalLife: "3-5 days", preservative: "Freezing", extendedLife: "6-12 months", chemical: "Sodium Ascorbate" },
    "pork": { normalLife: "3-5 days", preservative: "Freezing", extendedLife: "6 months", chemical: "Potassium Lactate" },
    "lentils": { normalLife: "1 year", preservative: "Airtight Container", extendedLife: "2-3 years", chemical: "Diatomaceous Earth" },
    "chickpeas": { normalLife: "1 year", preservative: "Airtight Container", extendedLife: "2-3 years", chemical: "Oxygen Absorbers" },

    // Grains & Pantry
    "bread": { normalLife: "3-5 days", preservative: "Freezing", extendedLife: "3 months", chemical: "Calcium Propionate" },
    "rice": { normalLife: "1-2 years", preservative: "Airtight Container", extendedLife: "30 years", chemical: "Oxygen Absorbers" },
    "pasta": { normalLife: "1-2 years", preservative: "Airtight Container", extendedLife: "3 years", chemical: "None" },
    "oats": { normalLife: "1 year", preservative: "Airtight Container", extendedLife: "2 years", chemical: "BHT (Antioxidant)" },
    "cereal": { normalLife: "6-12 months", preservative: "Airtight Container", extendedLife: "1 year", chemical: "BHA / BHT" },
    "flour": { normalLife: "6-8 months", preservative: "Freezing", extendedLife: "1-2 years", chemical: "Benzoyl Peroxide (Bleaching)" },
    "sugar": { normalLife: "Indefinite", preservative: "Airtight Container", extendedLife: "Indefinite", chemical: "None (Hygroscopic)" },
    "salt": { normalLife: "Indefinite", preservative: "Airtight Container", extendedLife: "Indefinite", chemical: "Sodium Aluminosilicate (Anti-caking)" },
    "honey": { normalLife: "Indefinite", preservative: "Airtight Container", extendedLife: "Indefinite", chemical: "None (Natural Antibacterial)" },
    "jam": { normalLife: "6-12 months", preservative: "Refrigeration (Opened)", extendedLife: "1 year", chemical: "Pectin / Citric Acid" },
    "peanut butter": { normalLife: "6-9 months", preservative: "Cool, Dark Place", extendedLife: "1 year", chemical: "Hydrogenated Vegetable Oil" },
    "almonds": { normalLife: "9-12 months", preservative: "Refrigeration", extendedLife: "2 years", chemical: "Vitamin E (Natural Antioxidant)" },
    "walnuts": { normalLife: "6 months", preservative: "Refrigeration", extendedLife: "1 year", chemical: "BHA" },
    "cashews": { normalLife: "6-9 months", preservative: "Refrigeration", extendedLife: "1 year", chemical: "Nitrogen Flushing" },

    // Beverages
    "coffee": { normalLife: "3-5 months", preservative: "Airtight Container", extendedLife: "1-2 years (Frozen)", chemical: "Nitrogen Flushing" },
    "tea": { normalLife: "6-12 months", preservative: "Airtight Container", extendedLife: "1-2 years", chemical: "None" },
    "orange juice": { normalLife: "7-10 days", preservative: "Refrigeration", extendedLife: "8-12 months (Frozen)", chemical: "Sodium Benzoate" },
    "apple juice": { normalLife: "7-10 days", preservative: "Refrigeration", extendedLife: "8-12 months (Frozen)", chemical: "Potassium Sorbate" },
    "yogurt drink": { normalLife: "1-2 weeks", preservative: "Refrigeration", extendedLife: "1 month", chemical: "Natamycin" },

    // Bakery
    "bagel": { normalLife: "3-5 days", preservative: "Freezing", extendedLife: "3 months", chemical: "Calcium Propionate" },
    "tortilla": { normalLife: "1 week", preservative: "Refrigeration", extendedLife: "1 month", chemical: "Fumaric Acid" },
};

export default function FoodPreservativePage() {
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadInventory() {
            try {
                const items = await getUserInventory();
                setInventory(items);
            } catch (error) {
                console.error("Failed to load inventory:", error);
                // Fallback to empty or handle error visually if needed
            } finally {
                setLoading(false);
            }
        }

        loadInventory();
    }, []);

    const getPreservationInfo = (itemName: string) => {
        const lowerName = itemName.toLowerCase();
        // Try exact match
        if (preservationDatabase[lowerName]) {
            return preservationDatabase[lowerName];
        }

        // Try partial match (e.g. "Green Apples" -> matches "apples")
        const key = Object.keys(preservationDatabase).find(k => lowerName.includes(k) || k.includes(lowerName));
        if (key) {
            return preservationDatabase[key];
        }

        return {
            normalLife: "N/A",
            preservative: "General Storage",
            extendedLife: "N/A",
            chemical: "None"
        };
    };

    // Helper to parse duration strings into days
    const parseDuration = (durationStr: string): number => {
        if (!durationStr || durationStr === "N/A" || durationStr === "Indefinite") return 0;

        const lower = durationStr.toLowerCase();
        const value = parseInt(lower.match(/\d+/)?.[0] || "0");

        if (lower.includes("year")) return value * 365;
        if (lower.includes("month")) return value * 30;
        if (lower.includes("week")) return value * 7;
        return value; // days
    };

    const calculateDates = (item: UserInventoryItem, info: any) => {
        const today = new Date();
        let normalDisplay = info.normalLife;
        let extendedDisplay = info.extendedLife;
        let isExpired = false;

        if (item.expirationDate) {
            const expDate = new Date(item.expirationDate);
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                isExpired = true;
                normalDisplay = `Expired ${Math.abs(diffDays)} days ago (${expDate.toLocaleDateString()})`;
                extendedDisplay = "Expired - Cannot Extend";
            } else {
                normalDisplay = `${diffDays} days left (${expDate.toLocaleDateString()})`;

                // Calculate extended date
                // If we have purchase date, calculate from there. Else assume current expiry is based on normal life.
                const extendedDays = parseDuration(info.extendedLife);
                const normalDays = parseDuration(info.normalLife);

                if (extendedDays > 0) {
                    let baseDate = item.purchaseDate ? new Date(item.purchaseDate) : new Date(expDate.getTime() - (normalDays * 24 * 60 * 60 * 1000));
                    // If base date calculation results in invalid date or way in past, just use today as baseline for "extending from now" logic if that makes more sense, 
                    // BUT usually preservation implies starting from fresh. 
                    // If item is already near expiry, preservation might not add full extended life.
                    // For simplicity/MVP: We calculate what the date WOULD be if preserved properly from start.

                    const newExpDate = new Date(baseDate.getTime() + (extendedDays * 24 * 60 * 60 * 1000));

                    // If the calculated extended date is actually BEFORE the current expiry (e.g. data inconsistency), ignore it
                    if (newExpDate > expDate) {
                        extendedDisplay = `Until ${newExpDate.toLocaleDateString()} (approx)`;
                    }
                }
            }
        }

        return { normalDisplay, extendedDisplay, isExpired };
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
                <SiteHeader />

                <main className="flex-1 py-12">
                    <div className="w-full mx-auto">
                        <h1 className="text-3xl font-bold text-[#714B67] mb-8 text-center">
                            Food Preservative Guide
                        </h1>
                        <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
                            Learn how to extend the shelf life of your personal inventory with proper preservation techniques.
                        </p>

                        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                            My Food
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                            Normally stay
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                            Preservative / Method
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                            Chemical / Additive
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                            Extended stay
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                Loading your inventory...
                                            </td>
                                        </tr>
                                    ) : inventory.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                No items found in your inventory.
                                            </td>
                                        </tr>
                                    ) : (
                                        inventory.map((item) => {
                                            const info = getPreservationInfo(item.itemName);
                                            const { normalDisplay, extendedDisplay, isExpired } = calculateDates(item, info);

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        {item.itemName}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isExpired ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                                        {normalDisplay}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {info.preservative}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {info.chemical}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isExpired ? 'text-red-600' : 'text-[#714B67]'}`}>
                                                        {extendedDisplay}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Analysis Section */}
                        {!loading && inventory.length > 0 && (
                            <div className="mt-12 bg-slate-50 rounded-xl p-8 border border-slate-200">
                                <h2 className="text-2xl font-bold text-[#714B67] mb-6">
                                    Preservation Analysis
                                </h2>
                                <div className="space-y-4">
                                    {Object.entries(
                                        inventory.reduce((acc, item) => {
                                            const info = getPreservationInfo(item.itemName);
                                            const key = info.preservative;
                                            if (!acc[key]) acc[key] = { items: [], chemicals: new Set() };
                                            acc[key].items.push(item.itemName);
                                            if (info.chemical !== "None") acc[key].chemicals.add(info.chemical);
                                            return acc;
                                        }, {} as Record<string, { items: string[], chemicals: Set<string> }>)
                                    ).map(([method, data]) => (
                                        <div key={method} className="flex items-start gap-3">
                                            <div className="mt-1.5 h-2 w-2 rounded-full bg-[#714B67] flex-shrink-0" />
                                            <div>
                                                <p className="text-slate-700">
                                                    Use <span className="font-semibold text-slate-900">{method}</span> for:{" "}
                                                    <span className="text-slate-600">{data.items.join(", ")}</span>
                                                </p>
                                                {data.chemicals.size > 0 && (
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        Recommended additives: {Array.from(data.chemicals).join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <SiteFooter />
            </div>
        </div>
    );
}
