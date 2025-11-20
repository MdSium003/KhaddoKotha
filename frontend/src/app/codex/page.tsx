"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchFoodInventory, type FoodInventoryItem } from "@/lib/api";

const MAX_EXPIRATION = 365;

export default function CodexPage() {
  const [inventory, setInventory] = useState<FoodInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expirationFilter, setExpirationFilter] = useState<number>(MAX_EXPIRATION);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<FoodInventoryItem | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        const data = await fetchFoodInventory();
        setInventory(data);
        setSelectedItem(data[0] ?? null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Global Codex");
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  const allCategories = useMemo(
    () => Array.from(new Set(inventory.map((item) => item.category))).sort(),
    [inventory],
  );

  const filteredInventory = useMemo(
    () =>
      inventory
        .filter((item) => (categoryFilter === "all" ? true : item.category === categoryFilter))
        .filter((item) => item.expiration_days <= expirationFilter)
        .filter((item) => item.item_name.toLowerCase().includes(search.toLowerCase())),
    [inventory, categoryFilter, expirationFilter, search],
  );

  const filteredCategories = useMemo(
    () => Array.from(new Set(filteredInventory.map((item) => item.category))).sort(),
    [filteredInventory],
  );

  const avgCost =
    filteredInventory.reduce((sum, item) => sum + Number(item.cost_per_unit), 0) /
    (filteredInventory.length || 1);

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <div className="mx-auto min-h-screen max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-medium mb-4"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Global Food Codex</h1>
            <p className="text-lg text-slate-600">
              A complete catalogue of pantry staples with pricing, shelf-life, and sourcing insights.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl bg-white/80 px-6 py-4 shadow-md sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Items</p>
              <p className="text-2xl font-bold text-slate-900">{filteredInventory.length}</p>
              <p className="text-xs text-slate-500">Entries shown</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Categories</p>
              <p className="text-2xl font-bold text-slate-900">{filteredCategories.length}</p>
              <p className="text-xs text-slate-500">Grouped types</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Avg Cost</p>
              <p className="text-2xl font-bold text-slate-900">${avgCost.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Across filters</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-slate-600">Loading codex...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {!loading && !error && inventory.length === 0 && (
          <div className="rounded-lg bg-white/80 border border-white/60 p-8 text-center">
            <p className="text-slate-600">No codex entries found.</p>
          </div>
        )}

        {!loading && !error && inventory.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-lg">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="all">All Categories</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Max Expiration ({expirationFilter} days)
                  </label>
                  <input
                    type="range"
                    min={7}
                    max={MAX_EXPIRATION}
                    value={expirationFilter}
                    onChange={(e) => setExpirationFilter(Number(e.target.value))}
                    className="accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>7 days</span>
                    <span>365 days</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Search
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ingredient..."
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Expiration
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Cost / Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInventory.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`cursor-pointer transition ${
                            selectedItem?.id === item.id ? "bg-emerald-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900">{item.item_name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.expiration_days} days</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                            ${Number(item.cost_per_unit).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                            No items match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Item Details</p>
              {selectedItem ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{selectedItem.item_name}</h2>
                    <p className="mt-1 text-sm uppercase tracking-[0.4em] text-slate-500">{selectedItem.category}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Shelf Life</p>
                    <p className="text-3xl font-bold text-emerald-900">{selectedItem.expiration_days} days</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cost Per Unit</p>
                    <p className="text-3xl font-bold text-slate-900">
                      ${Number(selectedItem.cost_per_unit).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm text-slate-600">
                      Keep an eye on this ingredient’s pricing trend and expiration window to plan purchases with zero
                      waste.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-500">Select an item from the table to view full details.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

