"use client";

import { useEffect, useState } from "react";
import { fetchResources, type Resource } from "@/lib/api";
import Link from "next/link";

type CategoryFilter = "all" | "waste_reduction" | "nutrition" | "meal_planning" | "storage_tips" | "budget";
type TypeFilter = "all" | "article" | "video" | "guide";

const categoryLabels: Record<string, string> = {
  all: "All Categories",
  waste_reduction: "Waste Reduction",
  nutrition: "Nutrition",
  meal_planning: "Meal Planning",
  storage_tips: "Storage Tips",
  budget: "Budget & Savings",
};

const typeLabels: Record<string, string> = {
  all: "All Types",
  article: "Articles",
  video: "Videos",
  guide: "Guides",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    async function loadResources() {
      try {
        setLoading(true);
        const data = await fetchResources();
        setResources(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load resources");
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  useEffect(() => {
    let filtered = resources;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((r) => r.category === categoryFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    setFilteredResources(filtered);
  }, [resources, categoryFilter, typeFilter]);

  // Group resources by category
  const groupedResources = filteredResources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  const categories = Object.keys(groupedResources).sort();

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category] || category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "article":
        return "bg-blue-100 text-blue-800";
      case "video":
        return "bg-red-100 text-red-800";
      case "guide":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            Resources & Tips
          </h1>
          <p className="text-lg text-slate-600">
            Browse our collection of tips, guides, and articles on waste reduction, nutrition, meal planning, and more
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-slate-600">Loading resources...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {!loading && !error && filteredResources.length === 0 && (
          <div className="rounded-lg bg-white/80 border border-white/60 p-8 text-center">
            <p className="text-slate-600">No resources found matching your filters.</p>
            <button
              onClick={() => {
                setCategoryFilter("all");
                setTypeFilter("all");
              }}
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredResources.length > 0 && (
          <div className="space-y-8">
            {categories.map((category) => (
              <div
                key={category}
                className="rounded-2xl border border-white/60 bg-white/90 shadow-lg overflow-hidden"
              >
                <div className="bg-emerald-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">
                    {getCategoryLabel(category)}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    {groupedResources[category].length} resource{groupedResources[category].length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedResources[category].map((resource) => (
                      <div
                        key={resource.id}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeColor(
                              resource.type
                            )}`}
                          >
                            {typeLabels[resource.type] || resource.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {resource.title}
                        </h3>
                        {resource.description && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            View Resource →
                          </a>
                        )}
                        {!resource.url && (
                          <span className="inline-flex items-center text-sm text-slate-400">
                            Coming soon
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 text-center text-sm text-slate-600">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        )}
      </div>
    </div>
  );
}

