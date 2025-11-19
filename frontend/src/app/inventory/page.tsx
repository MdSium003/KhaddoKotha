"use client";

import { useEffect, useState } from "react";
import { fetchFoodInventory, type FoodInventoryItem } from "@/lib/api";
import Link from "next/link";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<FoodInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        const data = await fetchFoodInventory();
        setInventory(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  // Group items by category
  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FoodInventoryItem[]>);

  const categories = Object.keys(groupedInventory).sort();

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <div className="mx-auto min-h-screen max-w-7xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-medium mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            General Food Inventory
          </h1>
          <p className="text-lg text-slate-600">
            Browse our complete food inventory with pricing and expiration information
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-slate-600">Loading inventory...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {!loading && !error && inventory.length === 0 && (
          <div className="rounded-lg bg-white/80 border border-white/60 p-8 text-center">
            <p className="text-slate-600">No inventory items found.</p>
          </div>
        )}

        {!loading && !error && inventory.length > 0 && (
          <div className="space-y-8">
            {categories.map((category) => (
              <div
                key={category}
                className="rounded-2xl border border-white/60 bg-white/90 shadow-lg overflow-hidden"
              >
                <div className="bg-emerald-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">{category}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Expiration Days
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Cost per Unit ($)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {groupedInventory[category].map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-emerald-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {item.item_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">
                              {item.expiration_days} days
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-emerald-700">
                              ${Number(item.cost_per_unit).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

