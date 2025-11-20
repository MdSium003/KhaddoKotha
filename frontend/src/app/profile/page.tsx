"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import {
  updateProfile,
  createFoodUsageLog,
  bulkCreateFoodUsageLogs,
  getFoodUsageLogs,
  fetchFoodInventory,
  getUserInventory,
  createUserInventoryItem,
  bulkCreateUserInventoryItems,
  deleteUserInventoryItem,
  type FoodUsageLog,
  type FoodInventoryItem,
  type FoodUsageLogData,
  type UserInventoryItem,
  type UserInventoryItemData,
} from "@/lib/api";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [budgetPreferences, setBudgetPreferences] = useState<"low" | "medium" | "high" | "">("");
  const [dietaryNeeds, setDietaryNeeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Food usage logging state
  const [showFoodUsage, setShowFoodUsage] = useState(false);
  const [foodUsageMethod, setFoodUsageMethod] = useState<"csv" | "manual" | "dropdown">("manual");
  const [foodUsageLogs, setFoodUsageLogs] = useState<FoodUsageLog[]>([]);
  const [inventoryItems, setInventoryItems] = useState<FoodInventoryItem[]>([]);
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);

  // Manual entry state
  const [manualEntries, setManualEntries] = useState<FoodUsageLogData[]>([
    { itemName: "", quantity: 1, category: "" },
  ]);

  // Dropdown selection state
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<number | "">("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // User inventory state
  const [showUserInventory, setShowUserInventory] = useState(false);
  const [userInventoryMethod, setUserInventoryMethod] = useState<"csv" | "manual" | "dropdown">("manual");
  const [userInventoryItems, setUserInventoryItems] = useState<UserInventoryItem[]>([]);

  // Manual entry state for inventory
  const [manualInventoryEntries, setManualInventoryEntries] = useState<UserInventoryItemData[]>([
    { itemName: "", quantity: 1, category: "", purchaseDate: "", expirationDate: "", notes: "" },
  ]);

  // Dropdown selection state for inventory
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<number | "">("");
  const [selectedInventoryQuantity, setSelectedInventoryQuantity] = useState(1);
  const [selectedPurchaseDate, setSelectedPurchaseDate] = useState("");
  const [selectedExpirationDate, setSelectedExpirationDate] = useState("");

  // CSV upload state for inventory
  const [inventoryCsvFile, setInventoryCsvFile] = useState<File | null>(null);
  const [inventoryCsvLoading, setInventoryCsvLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBudgetPreferences(user.budgetPreferences || "");
      setDietaryNeeds(user.dietaryNeeds || "");
    }
  }, [user]);

  useEffect(() => {
    if (showFoodUsage && user) {
      loadFoodUsageLogs();
      loadInventory();
    }
  }, [showFoodUsage, usageDate, user]);

  useEffect(() => {
    if (showUserInventory && user) {
      loadUserInventory();
      if (userInventoryMethod === "dropdown") {
        loadInventory();
      }
    }
  }, [showUserInventory, user, userInventoryMethod]);

  const loadFoodUsageLogs = async () => {
    try {
      const logs = await getFoodUsageLogs(usageDate);
      setFoodUsageLogs(logs);
    } catch (err) {
      console.error("Failed to load food usage logs:", err);
    }
  };

  const loadInventory = async () => {
    try {
      const items = await fetchFoodInventory();
      setInventoryItems(items);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    }
  };

  const loadUserInventory = async () => {
    try {
      const items = await getUserInventory();
      setUserInventoryItems(items);
    } catch (err) {
      console.error("Failed to load user inventory:", err);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const updateData: {
        name?: string;
        budgetPreferences?: "low" | "medium" | "high";
        dietaryNeeds?: string;
      } = {};

      if (name !== user?.name) {
        updateData.name = name;
      }
      if (budgetPreferences !== (user?.budgetPreferences || "")) {
        if (budgetPreferences) {
          updateData.budgetPreferences = budgetPreferences as "low" | "medium" | "high";
        }
      }
      if (dietaryNeeds !== (user?.dietaryNeeds || "")) {
        updateData.dietaryNeeds = dietaryNeeds;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setLoading(false);
        return;
      }

      await updateProfile(updateData);
      await refreshUser();
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setBudgetPreferences(user.budgetPreferences || "");
      setDietaryNeeds(user.dietaryNeeds || "");
    }
    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  // Food usage handlers
  const handleAddManualEntry = () => {
    setManualEntries([...manualEntries, { itemName: "", quantity: 1, category: "" }]);
  };

  const handleRemoveManualEntry = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index));
  };

  const handleManualEntryChange = (index: number, field: keyof FoodUsageLogData, value: string | number) => {
    const updated = [...manualEntries];
    updated[index] = { ...updated[index], [field]: value };
    setManualEntries(updated);
  };

  const handleSubmitManualEntries = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const validEntries = manualEntries.filter(
        (entry) => entry.itemName && entry.category && entry.quantity > 0
      );

      if (validEntries.length === 0) {
        setError("Please fill in at least one valid entry");
        setLoading(false);
        return;
      }

      const entriesWithDate = validEntries.map((entry) => ({
        ...entry,
        usageDate,
      }));

      await bulkCreateFoodUsageLogs(entriesWithDate);
      setSuccess(`Successfully logged ${validEntries.length} food usage entries!`);
      setManualEntries([{ itemName: "", quantity: 1, category: "" }]);
      await loadFoodUsageLogs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log food usage");
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryItemSelect = async () => {
    if (!selectedInventoryItem) {
      setError("Please select an item from inventory");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const item = inventoryItems.find((i) => i.id === Number(selectedInventoryItem));
      if (!item) {
        throw new Error("Selected item not found");
      }

      await createFoodUsageLog({
        itemName: item.item_name,
        quantity: selectedQuantity,
        category: item.category,
        usageDate,
      });

      setSuccess("Food usage logged successfully!");
      setSelectedInventoryItem("");
      setSelectedQuantity(1);
      await loadFoodUsageLogs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log food usage");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError("Please select a CSV file");
      return;
    }

    setError("");
    setSuccess("");
    setCsvLoading(true);

    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());

      const itemNameIndex = headers.findIndex(
        (h) => h.includes("item") || h.includes("name")
      );
      const quantityIndex = headers.findIndex(
        (h) => h.includes("quantity") || h.includes("qty") || h.includes("amount")
      );
      const categoryIndex = headers.findIndex((h) => h.includes("category"));

      if (itemNameIndex === -1 || quantityIndex === -1 || categoryIndex === -1) {
        throw new Error(
          "CSV must have columns: item name, quantity, and category"
        );
      }

      const entries: FoodUsageLogData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values[itemNameIndex] && values[quantityIndex] && values[categoryIndex]) {
          entries.push({
            itemName: values[itemNameIndex],
            quantity: parseFloat(values[quantityIndex]) || 1,
            category: values[categoryIndex],
            usageDate,
          });
        }
      }

      if (entries.length === 0) {
        throw new Error("No valid entries found in CSV");
      }

      await bulkCreateFoodUsageLogs(entries);
      setSuccess(`Successfully uploaded ${entries.length} entries from CSV!`);
      setCsvFile(null);
      await loadFoodUsageLogs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process CSV file");
    } finally {
      setCsvLoading(false);
    }
  };

  // User inventory handlers
  const handleAddManualInventoryEntry = () => {
    setManualInventoryEntries([
      ...manualInventoryEntries,
      { itemName: "", quantity: 1, category: "", purchaseDate: "", expirationDate: "", notes: "" },
    ]);
  };

  const handleRemoveManualInventoryEntry = (index: number) => {
    setManualInventoryEntries(manualInventoryEntries.filter((_, i) => i !== index));
  };

  const handleManualInventoryEntryChange = (
    index: number,
    field: keyof UserInventoryItemData,
    value: string | number
  ) => {
    const updated = [...manualInventoryEntries];
    updated[index] = { ...updated[index], [field]: value };
    setManualInventoryEntries(updated);
  };

  const handleSubmitManualInventoryEntries = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const validEntries = manualInventoryEntries.filter(
        (entry) => entry.itemName && entry.category && entry.quantity > 0
      );

      if (validEntries.length === 0) {
        setError("Please fill in at least one valid entry");
        setLoading(false);
        return;
      }

      await bulkCreateUserInventoryItems(validEntries);
      setSuccess(`Successfully added ${validEntries.length} items to inventory!`);
      setManualInventoryEntries([
        { itemName: "", quantity: 1, category: "", purchaseDate: "", expirationDate: "", notes: "" },
      ]);
      await loadUserInventory();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add items to inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryItemSelectForInventory = async () => {
    if (!selectedInventoryItemId) {
      setError("Please select an item from inventory");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const item = inventoryItems.find((i) => i.id === Number(selectedInventoryItemId));
      if (!item) {
        throw new Error("Selected item not found");
      }

      // Calculate expiration date from purchase date + expiration_days
      let calculatedExpirationDate = selectedExpirationDate || undefined;
      if (selectedPurchaseDate && item.expiration_days) {
        const purchaseDate = new Date(selectedPurchaseDate);
        purchaseDate.setDate(purchaseDate.getDate() + item.expiration_days);
        calculatedExpirationDate = purchaseDate.toISOString().split('T')[0];
      }

      await createUserInventoryItem({
        itemName: item.item_name,
        quantity: selectedInventoryQuantity,
        category: item.category,
        purchaseDate: selectedPurchaseDate || undefined,
        expirationDate: calculatedExpirationDate,
      });

      setSuccess("Item added to inventory successfully!");
      setSelectedInventoryItemId("");
      setSelectedInventoryQuantity(1);
      setSelectedPurchaseDate("");
      setSelectedExpirationDate("");
      await loadUserInventory();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item to inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryCsvUpload = async () => {
    if (!inventoryCsvFile) {
      setError("Please select a CSV file");
      return;
    }

    setError("");
    setSuccess("");
    setInventoryCsvLoading(true);

    try {
      const text = await inventoryCsvFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());

      const itemNameIndex = headers.findIndex((h) => h.includes("item") || h.includes("name"));
      const quantityIndex = headers.findIndex(
        (h) => h.includes("quantity") || h.includes("qty") || h.includes("amount")
      );
      const categoryIndex = headers.findIndex((h) => h.includes("category"));
      const purchaseDateIndex = headers.findIndex((h) => h.includes("purchase"));
      const expirationDateIndex = headers.findIndex((h) => h.includes("expiration") || h.includes("expiry"));

      if (itemNameIndex === -1 || quantityIndex === -1 || categoryIndex === -1) {
        throw new Error("CSV must have columns: item name, quantity, and category");
      }

      const entries: UserInventoryItemData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values[itemNameIndex] && values[quantityIndex] && values[categoryIndex]) {
          entries.push({
            itemName: values[itemNameIndex],
            quantity: parseFloat(values[quantityIndex]) || 1,
            category: values[categoryIndex],
            purchaseDate: purchaseDateIndex !== -1 ? values[purchaseDateIndex] : undefined,
            expirationDate: expirationDateIndex !== -1 ? values[expirationDateIndex] : undefined,
          });
        }
      }

      if (entries.length === 0) {
        throw new Error("No valid entries found in CSV");
      }

      await bulkCreateUserInventoryItems(entries);
      setSuccess(`Successfully uploaded ${entries.length} items from CSV!`);
      setInventoryCsvFile(null);
      await loadUserInventory();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process CSV file");
    } finally {
      setInventoryCsvLoading(false);
    }
  };

  const handleDeleteInventoryItem = async (id: number) => {
    if (!confirm("Are you sure you want to remove this item from your inventory?")) {
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await deleteUserInventoryItem(id);
      setSuccess("Item removed from inventory successfully!");
      await loadUserInventory();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#BCEBD7] text-slate-900 flex flex-col">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 pt-24">
          <SiteHeader />
          <main className="mt-10 flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-emerald-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading profile...</p>
            </div>
          </main>
          <SiteFooter />
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900 flex flex-col">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 pt-24">
        <SiteHeader />

        <main className="mt-10 flex flex-1 flex-col gap-8">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
              <button
                onClick={logout}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Logout
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-[200px,1fr]">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-32 w-32 rounded-full border-4 border-emerald-200 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-500 text-4xl font-bold text-white shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  {user.name}
                </h2>
              </div>

              {/* Profile Details */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      Account Information
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="rounded-lg border border-emerald-300 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-lg font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-slate-900">
                          {user.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        Email Address
                      </label>
                      <p className="text-lg text-slate-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        User ID
                      </label>
                      <p className="text-sm font-mono text-slate-600">
                        #{user.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-700">
                    Preferences
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Budget Preferences
                      </label>
                      {isEditing ? (
                        <select
                          value={budgetPreferences}
                          onChange={(e) =>
                            setBudgetPreferences(
                              e.target.value as "low" | "medium" | "high" | ""
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                          <option value="">Select budget preference</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <p className="text-lg text-slate-900 capitalize">
                          {user.budgetPreferences || "Not set"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Dietary Needs
                      </label>
                      {isEditing ? (
                        <textarea
                          value={dietaryNeeds}
                          onChange={(e) => setDietaryNeeds(e.target.value)}
                          placeholder="e.g., Vegetarian, Gluten-free, Allergies, etc."
                          rows={4}
                          maxLength={500}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                        />
                      ) : (
                        <p className="text-lg text-slate-900 whitespace-pre-wrap">
                          {user.dietaryNeeds || "Not set"}
                        </p>
                      )}
                      {isEditing && (
                        <p className="mt-1 text-xs text-slate-500">
                          {dietaryNeeds.length}/500 characters
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                    <p className="text-sm text-emerald-800">{success}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Food Usage Logging Section */}
          <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Daily Food Usage</h2>
                <p className="text-sm text-slate-600 mt-1">Log your daily food consumption</p>
              </div>
              <button
                onClick={() => setShowFoodUsage(!showFoodUsage)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {showFoodUsage ? "Hide" : "Log Food Usage"}
              </button>
            </div>

            {showFoodUsage && (
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Usage Date
                  </label>
                  <input
                    type="date"
                    value={usageDate}
                    onChange={(e) => setUsageDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                {/* Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Input Method
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFoodUsageMethod("manual")}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${foodUsageMethod === "manual"
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      Manual Entry
                    </button>
                    <button
                      onClick={() => setFoodUsageMethod("dropdown")}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${foodUsageMethod === "dropdown"
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      From Inventory
                    </button>
                    <button
                      onClick={() => setFoodUsageMethod("csv")}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${foodUsageMethod === "csv"
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      CSV Upload
                    </button>
                  </div>
                </div>

                {/* Manual Entry Form */}
                {foodUsageMethod === "manual" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Manual Entry</h3>
                      <button
                        onClick={handleAddManualEntry}
                        className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        + Add Entry
                      </button>
                    </div>
                    <div className="space-y-4">
                      {manualEntries.map((entry, index) => (
                        <div
                          key={index}
                          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[2fr,1fr,2fr,auto]"
                        >
                          <input
                            type="text"
                            placeholder="Item name"
                            value={entry.itemName}
                            onChange={(e) =>
                              handleManualEntryChange(index, "itemName", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                          <input
                            type="number"
                            placeholder="Quantity"
                            min="0.01"
                            step="0.01"
                            value={entry.quantity}
                            onChange={(e) =>
                              handleManualEntryChange(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                          <input
                            type="text"
                            placeholder="Category"
                            value={entry.category}
                            onChange={(e) =>
                              handleManualEntryChange(index, "category", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                          {manualEntries.length > 1 && (
                            <button
                              onClick={() => handleRemoveManualEntry(index)}
                              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700 transition hover:bg-red-100"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleSubmitManualEntries}
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : "Save Entries"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dropdown Selection */}
                {foodUsageMethod === "dropdown" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">
                      Select from Inventory
                    </h3>
                    <div className="grid gap-4 md:grid-cols-[2fr,1fr,auto]">
                      <select
                        value={selectedInventoryItem}
                        onChange={(e) => setSelectedInventoryItem(Number(e.target.value) || "")}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      >
                        <option value="">Select an item...</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_name} ({item.category})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Quantity"
                        min="0.01"
                        step="0.01"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(parseFloat(e.target.value) || 1)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                      <button
                        onClick={handleInventoryItemSelect}
                        disabled={loading || !selectedInventoryItem}
                        className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </div>
                )}

                {/* CSV Upload */}
                {foodUsageMethod === "csv" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">CSV Upload</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Select CSV File
                        </label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          CSV format: item_name, quantity, category (header row required)
                        </p>
                      </div>
                      <button
                        onClick={handleCsvUpload}
                        disabled={csvLoading || !csvFile}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {csvLoading ? "Uploading..." : "Upload CSV"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Today's Logs */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    Logs for {new Date(usageDate).toLocaleDateString()}
                  </h3>
                  {foodUsageLogs.length === 0 ? (
                    <p className="text-slate-600">No logs for this date</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Item
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Category
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {foodUsageLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-sm text-slate-900">{log.itemName}</td>
                              <td className="px-4 py-2 text-sm text-slate-900">{log.quantity}</td>
                              <td className="px-4 py-2 text-sm text-slate-900">{log.category}</td>
                              <td className="px-4 py-2 text-sm text-slate-600">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Inventory Management Section */}
          <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Inventory</h2>
                <p className="text-sm text-slate-600 mt-1">Manage your personal food inventory</p>
              </div>
              <button
                onClick={() => setShowUserInventory(!showUserInventory)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {showUserInventory ? "Hide" : "Manage Inventory"}
              </button>
            </div>

            {showUserInventory && (
              <div className="space-y-6">
                {/* Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Input Method
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setUserInventoryMethod("manual")}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${userInventoryMethod === "manual"
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      Manual Entry
                    </button>
                    <button
                      onClick={() => setUserInventoryMethod("dropdown")}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${userInventoryMethod === "dropdown"
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      From Inventory
                    </button>
                    <button
                      onClick={() => setUserInventoryMethod("csv")}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${userInventoryMethod === "csv"
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      CSV Upload
                    </button>
                  </div>
                </div>

                {/* Manual Entry Form */}
                {userInventoryMethod === "manual" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Manual Entry</h3>
                      <button
                        onClick={handleAddManualInventoryEntry}
                        className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        + Add Entry
                      </button>
                    </div>
                    <div className="space-y-4">
                      {manualInventoryEntries.map((entry, index) => (
                        <div
                          key={index}
                          className="space-y-2 rounded-lg border border-slate-200 bg-white p-4"
                        >
                          <div className="grid gap-4 md:grid-cols-[2fr,1fr,2fr,auto]">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Item Name
                              </label>
                              <input
                                type="text"
                                placeholder="Item name"
                                value={entry.itemName}
                                onChange={(e) =>
                                  handleManualInventoryEntryChange(index, "itemName", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                placeholder="Quantity"
                                min="0.01"
                                step="0.01"
                                value={entry.quantity}
                                onChange={(e) =>
                                  handleManualInventoryEntryChange(
                                    index,
                                    "quantity",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Category
                              </label>
                              <input
                                type="text"
                                placeholder="Category"
                                value={entry.category}
                                onChange={(e) =>
                                  handleManualInventoryEntryChange(index, "category", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                            {manualInventoryEntries.length > 1 && (
                              <div className="flex items-end">
                                <button
                                  onClick={() => handleRemoveManualInventoryEntry(index)}
                                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Purchase Date (when you bought it)
                              </label>
                              <input
                                type="date"
                                value={entry.purchaseDate || ""}
                                onChange={(e) =>
                                  handleManualInventoryEntryChange(index, "purchaseDate", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Expiration Date (when it expires)
                              </label>
                              <input
                                type="date"
                                value={entry.expirationDate || ""}
                                onChange={(e) =>
                                  handleManualInventoryEntryChange(index, "expirationDate", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={handleSubmitManualInventoryEntries}
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : "Save Entries"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dropdown Selection */}
                {userInventoryMethod === "dropdown" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">
                      Select from General Inventory
                    </h3>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-[2fr,1fr,auto]">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Select Item
                          </label>
                          <select
                            value={selectedInventoryItemId}
                            onChange={(e) => setSelectedInventoryItemId(Number(e.target.value) || "")}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          >
                            <option value="">Select an item...</option>
                            {inventoryItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.item_name} ({item.category})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            placeholder="Quantity"
                            min="0.01"
                            step="0.01"
                            value={selectedInventoryQuantity}
                            onChange={(e) => setSelectedInventoryQuantity(parseFloat(e.target.value) || 1)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleInventoryItemSelectForInventory}
                            disabled={loading || !selectedInventoryItemId}
                            className="w-full rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Purchase Date (when you bought it)
                          </label>
                          <input
                            type="date"
                            value={selectedPurchaseDate}
                            onChange={(e) => {
                              setSelectedPurchaseDate(e.target.value);
                              // Auto-calculate expiration date when purchase date changes
                              if (e.target.value && selectedInventoryItemId) {
                                const item = inventoryItems.find((i) => i.id === Number(selectedInventoryItemId));
                                if (item && item.expiration_days) {
                                  const purchaseDate = new Date(e.target.value);
                                  purchaseDate.setDate(purchaseDate.getDate() + item.expiration_days);
                                  setSelectedExpirationDate(purchaseDate.toISOString().split('T')[0]);
                                }
                              }
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Expiration Date (auto-calculated from general inventory)
                          </label>
                          <input
                            type="date"
                            value={selectedExpirationDate}
                            onChange={(e) => setSelectedExpirationDate(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            readOnly={!!(selectedPurchaseDate && selectedInventoryItemId)}
                            style={selectedPurchaseDate && selectedInventoryItemId ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                          />
                          {selectedPurchaseDate && selectedInventoryItemId && (
                            <p className="mt-1 text-xs text-slate-500">
                              Auto-calculated from purchase date + expiration days
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CSV Upload */}
                {userInventoryMethod === "csv" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">CSV Upload</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Select CSV File
                        </label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => setInventoryCsvFile(e.target.files?.[0] || null)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          CSV format: item_name, quantity, category, purchase_date (optional - when you bought it), expiration_date (optional - when it expires)
                        </p>
                      </div>
                      <button
                        onClick={handleInventoryCsvUpload}
                        disabled={inventoryCsvLoading || !inventoryCsvFile}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {inventoryCsvLoading ? "Uploading..." : "Upload CSV"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Current Inventory List */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Current Inventory</h3>
                    <button
                      onClick={loadUserInventory}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                  </div>
                  {userInventoryItems.length === 0 ? (
                    <p className="text-slate-600">No items in your inventory</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Item
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Category
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Purchase Date
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Expiration Date
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {userInventoryItems.map((item) => {
                            const isExpired = item.expirationDate
                              ? new Date(item.expirationDate) < new Date()
                              : false;
                            const isExpiringSoon = item.expirationDate
                              ? new Date(item.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                              new Date(item.expirationDate) >= new Date()
                              : false;

                            return (
                              <tr
                                key={item.id}
                                className={`hover:bg-slate-50 ${isExpired ? "bg-red-50" : isExpiringSoon ? "bg-yellow-50" : ""
                                  }`}
                              >
                                <td className="px-4 py-2 text-sm font-medium text-slate-900">
                                  {item.itemName}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900">{item.quantity}</td>
                                <td className="px-4 py-2 text-sm text-slate-900">{item.category}</td>
                                <td className="px-4 py-2 text-sm text-slate-600">
                                  {item.purchaseDate
                                    ? new Date(item.purchaseDate).toLocaleDateString()
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-600">
                                  {item.expirationDate
                                    ? new Date(item.expirationDate).toLocaleDateString()
                                    : "-"}
                                  {isExpired && (
                                    <span className="ml-2 text-xs text-red-600">(Expired)</span>
                                  )}
                                  {isExpiringSoon && !isExpired && (
                                    <span className="ml-2 text-xs text-yellow-600">(Expiring Soon)</span>
                                  )}
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() => handleDeleteInventoryItem(item.id)}
                                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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

