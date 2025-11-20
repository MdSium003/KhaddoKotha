"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { fetchFoodInventory, type FoodInventoryItem, fetchResources, type Resource } from "@/lib/api";

const DISPLAY_INTERVAL_MS = 5500;

const inventoryCategoryIcons: Record<string, JSX.Element> = {
  Dairy: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M8 7h8" stroke="currentColor" strokeLinecap="round" />
      <path d="M9 3h6l1 4v11a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  Fruit: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M12 21c4.418 0 8-2.91 8-6.5S16.418 8 12 8s-8 2.91-8 6.5S7.582 21 12 21z" stroke="currentColor" />
      <path d="M12 8s-2-4-5-4" stroke="currentColor" strokeLinecap="round" />
      <path d="M12 8s2-4 5-4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  Vegetable: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M6 9c0-2 1-4 3.5-4S13 7 13 9s-1 4-3.5 4S6 11 6 9z" stroke="currentColor" />
      <path d="M13 9c0 2 1 4 3.5 4S20 11 20 9s-1-4-3.5-4S13 7 13 9z" stroke="currentColor" />
      <path d="M10 13v5.5a1.5 1.5 0 0 1-3 0V13" stroke="currentColor" strokeLinecap="round" />
      <path d="M17 13v5.5a1.5 1.5 0 0 1-3 0V13" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  Protein: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M4 13c0-4.5 4-8 8-8s8 3.5 8 8-4 8-8 8" stroke="currentColor" />
      <path d="M4 13c0 4.5 4 8 8 8" stroke="currentColor" />
      <path d="M4 13c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  Grain: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M7 5v14" stroke="currentColor" strokeLinecap="round" />
      <path d="M11 5v14" stroke="currentColor" strokeLinecap="round" />
      <path d="M15 5v14" stroke="currentColor" strokeLinecap="round" />
      <path d="M19 5v14" stroke="currentColor" strokeLinecap="round" />
      <path d="M3 5v14" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
};

const resourceCategoryIcons: Record<string, JSX.Element> = {
  waste_reduction: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M6 7h12" stroke="currentColor" strokeLinecap="round" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" />
      <path d="M7 7l1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" stroke="currentColor" />
      <path d="M14 11l-4 4M10 11l4 4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  nutrition: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M12 3v18" stroke="currentColor" strokeLinecap="round" />
      <path d="M6 9h12" stroke="currentColor" strokeLinecap="round" />
      <path d="M6 15h12" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  meal_planning: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeLinecap="round" />
      <path d="M7 10h3v3H7zM7 14h3v3H7zM12 10h5" stroke="currentColor" />
    </svg>
  ),
  storage_tips: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M6 8h12v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8z" stroke="currentColor" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" />
      <path d="M9 12h6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  budget: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" strokeWidth={1.5} fill="none">
      <path d="M12 3v18" stroke="currentColor" strokeLinecap="round" />
      <path d="M8 7h4a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatLabel(label: string) {
  return label
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const tickerVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export function ResourceTickers() {
  const [inventoryItems, setInventoryItems] = useState<FoodInventoryItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [inventoryIndex, setInventoryIndex] = useState(0);
  const [resourceIndex, setResourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [inventoryData, resourceData] = await Promise.all([fetchFoodInventory(), fetchResources()]);
        setInventoryItems(inventoryData);
        setResources(resourceData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load spotlight content");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (inventoryItems.length === 0) return;
    const interval = setInterval(
      () => setInventoryIndex((prev) => (prev + 1) % inventoryItems.length),
      DISPLAY_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [inventoryItems.length]);

  useEffect(() => {
    if (resources.length === 0) return;
    const interval = setInterval(() => setResourceIndex((prev) => (prev + 1) % resources.length), DISPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [resources.length]);

  const currentInventory = useMemo(
    () => (inventoryItems.length > 0 ? inventoryItems[inventoryIndex % inventoryItems.length] : null),
    [inventoryItems, inventoryIndex],
  );

  const currentResource = useMemo(
    () => (resources.length > 0 ? resources[resourceIndex % resources.length] : null),
    [resources, resourceIndex],
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-[#BCEBD7] via-white to-[#BCEBD7] p-8 shadow-2xl">
      <div className="absolute inset-0 opacity-50 blur-3xl">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.35),_transparent_60%)]" />
      </div>

      <div className="relative z-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white/80 p-6 backdrop-blur-lg border border-white shadow-lg">
          <header className="flex items-center justify-between border-b border-emerald-50 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-500">Global Codex</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">Inventory Spotlight</h3>
            </div>
            <Link
              href="/codex"
              target="_blank"
              className="inline-flex items-center rounded-full border border-emerald-300 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              View Codex →
            </Link>
          </header>

          <div className="mt-6 min-h-[160px]">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="inventory-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-emerald-700"
                >
                  Loading spotlight…
                </motion.div>
              )}

              {error && !loading && (
                <motion.p
                  key="inventory-error"
                  className="text-sm text-rose-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}

              {currentInventory && !loading && !error && (
                <motion.div
                  key={currentInventory.id}
                  variants={tickerVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="flex flex-col gap-4 lg:flex-row lg:items-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                    {inventoryCategoryIcons[currentInventory.category] ?? inventoryCategoryIcons.Grain}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-[0.4em] text-emerald-500">
                      {currentInventory.category}
                    </p>
                    <h4 className="text-2xl font-semibold text-slate-900">{currentInventory.item_name}</h4>
                    <dl className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      <div>
                        <dt className="text-slate-500">Shelf Life</dt>
                        <dd className="font-semibold text-slate-900">{currentInventory.expiration_days} days</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Cost / Unit</dt>
                        <dd className="font-semibold text-slate-900">
                          {formatCurrency(Number(currentInventory.cost_per_unit))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </article>

        <article className="rounded-2xl bg-white/80 p-6 backdrop-blur-lg border border-white shadow-lg">
          <header className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">Resource Spotlight</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">Expert Guidance</h3>
            </div>
            <Link
              href="/resources"
              target="_blank"
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              View Resources →
            </Link>
          </header>

          <div className="mt-6 min-h-[160px]">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="resource-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-slate-600"
                >
                  Loading spotlight…
                </motion.div>
              )}

              {error && !loading && (
                <motion.p
                  key="resource-error"
                  className="text-sm text-rose-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}

              {currentResource && !loading && !error && (
                <motion.div
                  key={currentResource.id}
                  variants={tickerVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="flex flex-col gap-4 lg:flex-row lg:items-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                    {resourceCategoryIcons[currentResource.category] ?? resourceCategoryIcons.nutrition}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
                      {formatLabel(currentResource.category)} · {formatLabel(currentResource.type)}
                    </p>
                    <h4 className="text-2xl font-semibold text-slate-900">{currentResource.title}</h4>
                    {currentResource.description && (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{currentResource.description}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </article>
      </div>
    </section>
  );
}

