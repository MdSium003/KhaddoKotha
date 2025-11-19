"use client";

import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useEffect, useState } from "react";
import { getUserInventory, UserInventoryItem, request } from "@/lib/api";

export default function WasteToAssetPage() {
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

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

    const handleGenerateSuggestions = async (itemName: string) => {
        setSelectedItem(itemName);
        setAiLoading(true);
        setAiSuggestions(null);

        try {
            const response = await request<{ suggestions: string }>("/api/waste-to-asset", {
                method: "POST",
                body: JSON.stringify({ itemName }),
            });
            setAiSuggestions(response.suggestions);
        } catch (error) {
            console.error("Failed to get AI suggestions:", error);
            setAiSuggestions("Sorry, I couldn't generate suggestions at this time. Please try again later.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
                <SiteHeader />

                <main className="flex-1 py-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold text-[#714B67] mb-4">
                                Waste to Asset
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Don't let your food go to waste. Select an item from your inventory to get creative, AI-powered suggestions for repurposing it.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Inventory List */}
                            <div className="lg:col-span-1 bg-slate-50 rounded-2xl p-6 border border-slate-200 h-fit">
                                <h2 className="text-xl font-bold text-slate-900 mb-6">Your Inventory</h2>
                                {loading ? (
                                    <div className="text-center py-8 text-slate-500">Loading items...</div>
                                ) : inventory.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No items found.</div>
                                ) : (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                        {inventory.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleGenerateSuggestions(item.itemName)}
                                                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedItem === item.itemName
                                                        ? 'bg-white border-[#714B67] shadow-md ring-1 ring-[#714B67]'
                                                        : 'bg-white border-slate-200 hover:border-[#714B67]/50 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-slate-900">{item.itemName}</span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                        {item.category}
                                                    </span>
                                                </div>
                                                {item.expirationDate && (
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        Expires: {new Date(item.expirationDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* AI Result Area */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[400px] relative overflow-hidden">
                                    {!selectedItem ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-3xl">
                                                🌱
                                            </div>
                                            <h3 className="text-xl font-semibold text-slate-900 mb-2">Select an Item</h3>
                                            <p className="text-slate-500 max-w-sm">
                                                Choose an item from your inventory list to see how you can transform it into something useful.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                                                <div className="h-12 w-12 rounded-full bg-[#714B67]/10 flex items-center justify-center text-2xl">
                                                    ✨
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900">
                                                        Ideas for {selectedItem}
                                                    </h2>
                                                    <p className="text-slate-500 text-sm">
                                                        AI-generated suggestions
                                                    </p>
                                                </div>
                                            </div>

                                            {aiLoading ? (
                                                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                                    <div className="relative">
                                                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-[#714B67] animate-spin"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#714B67]">AI</div>
                                                    </div>
                                                    <p className="text-slate-600 font-medium animate-pulse">
                                                        Analyzing potential uses...
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="prose prose-slate max-w-none">
                                                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg">
                                                        {aiSuggestions}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <SiteFooter />
            </div>
        </div>
    );
}
