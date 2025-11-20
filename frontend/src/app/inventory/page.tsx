"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import {
  getUserInventory,
  createUserInventoryItem,
  bulkCreateUserInventoryItems,
  deleteUserInventoryItem,
  fetchFoodInventory,
  type UserInventoryItem,
  type UserInventoryItemData,
  type FoodInventoryItem,
} from "@/lib/api";

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userInventoryItems, setUserInventoryItems] = useState<UserInventoryItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<FoodInventoryItem[]>([]);
  const [inputMethod, setInputMethod] = useState<"manual" | "codex" | "csv">("manual");
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Manual entry state
  const [manualEntries, setManualEntries] = useState<UserInventoryItemData[]>([
    { itemName: "", quantity: 1, category: "", purchaseDate: "", expirationDate: "", notes: "" },
  ]);

  // Global Food Codex modal state
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodInventoryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalPurchaseDate, setModalPurchaseDate] = useState("");
  const [modalExpirationDate, setModalExpirationDate] = useState("");
  const [modalNotes, setModalNotes] = useState("");

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserInventory();
      if (inputMethod === "codex") {
        loadFoodInventory();
      }
    }
  }, [user, inputMethod]);

  const loadUserInventory = async () => {
    try {
      const items = await getUserInventory();
      setUserInventoryItems(items);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  };

  const loadFoodInventory = async () => {
    setInventoryLoading(true);
    try {
      const items = await fetchFoodInventory();
      setInventoryItems(items);
    } catch (error) {
      console.error("Failed to load food inventory:", error);
      setError("Failed to load Global Food Codex");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Manual Entry Functions
  const handleAddManualEntry = () => {
    setManualEntries([...manualEntries, { itemName: "", quantity: 1, category: "", purchaseDate: "", expirationDate: "", notes: "" }]);
  };

  const handleRemoveManualEntry = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index));
  };

  const handleManualEntryChange = (index: number, field: keyof UserInventoryItemData, value: string | number) => {
    const updated = [...manualEntries];
    updated[index] = { ...updated[index], [field]: value };
    setManualEntries(updated);
  };

  const handleSubmitManualEntries = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await bulkCreateUserInventoryItems(manualEntries);
      setSuccess(`${manualEntries.length} item(s) added successfully!`);
      setManualEntries([{ itemName: "", quantity: 1, category: "", purchaseDate: "", expirationDate: "", notes: "" }]);
      await loadUserInventory();
    } catch (error: any) {
      setError(error.message || "Failed to add items");
    } finally {
      setLoading(false);
    }
  };

  // Global Food Codex Functions
  const handleFoodItemClick = (item: FoodInventoryItem) => {
    setSelectedFoodItem(item);
    setShowModal(true);
    setModalQuantity(1);

    // Default purchase date to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setModalPurchaseDate(todayStr);

    // Auto-calculate expiration date based on expiration_days
    if (item.expiration_days && item.expiration_days > 0) {
      const expDate = new Date(today);
      expDate.setDate(expDate.getDate() + item.expiration_days);
      setModalExpirationDate(expDate.toISOString().split('T')[0]);
    } else {
      setModalExpirationDate("");
    }

    setModalNotes("");
  };

  // Recalculate expiration date when purchase date changes
  const handlePurchaseDateChange = (newPurchaseDate: string) => {
    setModalPurchaseDate(newPurchaseDate);

    if (selectedFoodItem && selectedFoodItem.expiration_days && selectedFoodItem.expiration_days > 0 && newPurchaseDate) {
      const purchaseDate = new Date(newPurchaseDate);
      const expDate = new Date(purchaseDate);
      expDate.setDate(expDate.getDate() + selectedFoodItem.expiration_days);
      setModalExpirationDate(expDate.toISOString().split('T')[0]);
    }
  };

  const handleAddFromCodex = async () => {
    if (!selectedFoodItem) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const newItem: UserInventoryItemData = {
        itemName: selectedFoodItem.item_name,
        quantity: modalQuantity,
        category: selectedFoodItem.category,
        purchaseDate: modalPurchaseDate || undefined,
        expirationDate: modalExpirationDate || undefined,
        notes: modalNotes || undefined,
      };

      await createUserInventoryItem(newItem);
      setSuccess("Item added from Global Food Codex!");
      setShowModal(false);
      setSelectedFoodItem(null);

      await loadUserInventory();
    } catch (error: any) {
      setError(error.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  // CSV Upload Functions
  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError("Please select a CSV file");
      return;
    }

    setCsvLoading(true);
    setError("");
    setSuccess("");

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter((line: string) => line.trim());
      const headers = lines[0].toLowerCase().split(',').map((h: string) => h.trim());

      const items: UserInventoryItemData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v: string) => v.trim());
        const item: UserInventoryItemData = {
          itemName: values[headers.indexOf('itemname')] || values[headers.indexOf('name')] || "",
          quantity: Number(values[headers.indexOf('quantity')]) || 1,
          category: values[headers.indexOf('category')] || "",
          purchaseDate: values[headers.indexOf('purchasedate')] || undefined,
          expirationDate: values[headers.indexOf('expirationdate')] || values[headers.indexOf('expiry')] || undefined,
          notes: values[headers.indexOf('notes')] || undefined,
        };
        if (item.itemName) items.push(item);
      }

      if (items.length === 0) {
        setError("No valid items found in CSV");
        return;
      }

      await bulkCreateUserInventoryItems(items);
      setSuccess(`${items.length} item(s) added from CSV!`);
      setCsvFile(null);
      await loadUserInventory();
    } catch (error: any) {
      setError(error.message || "Failed to upload CSV");
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteUserInventoryItem(id);
      setSuccess("Item deleted successfully!");
      await loadUserInventory();
    } catch (error: any) {
      setError(error.message || "Failed to delete item");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#BCEBD7] flex items-center justify-center">
        <div className="text-slate-900 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 pt-24">
        <SiteHeader />

        <main className="mt-10 flex flex-1 flex-col gap-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">My Inventory</h1>
            <p className="text-slate-600 mt-2">Manage your food inventory items</p>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-100 border border-red-300 p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-100 border border-green-300 p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Items Section */}
            <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Items</h2>

              {/* Input Method Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setInputMethod("manual")}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${inputMethod === "manual"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => setInputMethod("codex")}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${inputMethod === "codex"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  Global Food Codex
                </button>
                <button
                  onClick={() => setInputMethod("csv")}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${inputMethod === "csv"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  CSV Upload
                </button>
              </div>

              {/* Manual Entry */}
              {inputMethod === "manual" && (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {manualEntries.map((entry, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Item {index + 1}</h3>
                        {manualEntries.length > 1 && (
                          <button
                            onClick={() => handleRemoveManualEntry(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Item Name"
                        value={entry.itemName}
                        onChange={(e) => handleManualEntryChange(index, "itemName", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={entry.quantity}
                          onChange={(e) => handleManualEntryChange(index, "quantity", Number(e.target.value))}
                          min="1"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <select
                          value={entry.category}
                          onChange={(e) => handleManualEntryChange(index, "category", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="">Category</option>
                          <option value="vegetables">Vegetables</option>
                          <option value="fruits">Fruits</option>
                          <option value="grains">Grains</option>
                          <option value="dairy">Dairy</option>
                          <option value="meat">Meat</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={entry.purchaseDate}
                          onChange={(e) => handleManualEntryChange(index, "purchaseDate", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="date"
                          value={entry.expirationDate}
                          onChange={(e) => handleManualEntryChange(index, "expirationDate", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={entry.notes}
                        onChange={(e) => handleManualEntryChange(index, "notes", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleAddManualEntry}
                    className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                  >
                    + Add Another Item
                  </button>

                  <button
                    onClick={handleSubmitManualEntries}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Items"}
                  </button>
                </div>
              )}

              {/* Global Food Codex Grid */}
              {inputMethod === "codex" && (
                <div className="space-y-4">
                  {inventoryLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                          <p className="text-slate-600">Loading Global Food Codex...</p>
                        </div>
                      </div>
                      {/* Skeleton loading cards */}
                      <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="p-4 bg-slate-100 rounded-xl animate-pulse">
                            <div className="h-5 bg-slate-300 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                      {inventoryItems.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-slate-500">
                          No items found in Global Food Codex
                        </div>
                      ) : (
                        inventoryItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleFoodItemClick(item)}
                            className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-center"
                          >
                            <h3 className="font-semibold text-slate-900">{item.item_name}</h3>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CSV Upload */}
              {inputMethod === "csv" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-slate-600">
                        {csvFile ? csvFile.name : "Click to select CSV file"}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Format: itemName, quantity, category, purchaseDate, expirationDate, notes
                      </p>
                    </label>
                  </div>

                  <button
                    onClick={handleCsvUpload}
                    disabled={!csvFile || csvLoading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {csvLoading ? "Uploading..." : "Upload CSV"}
                  </button>
                </div>
              )}
            </div>

            {/* Current Inventory */}
            <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Current Inventory ({userInventoryItems.length} items)
              </h2>

              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {userInventoryItems.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No items in inventory. Add your first item!
                  </p>
                ) : (
                  userInventoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-300 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.itemName}</h3>
                          <p className="text-sm text-slate-600">
                            {item.quantity} {item.quantity > 1 ? "units" : "unit"} • {item.category}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {item.expirationDate && (
                        <p className="text-xs text-orange-600 font-semibold">
                          Expires: {new Date(item.expirationDate).toLocaleDateString()}
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-slate-500 mt-2">{item.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>

      {/* Modal for adding from Global Food Codex */}
      {showModal && selectedFoodItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedFoodItem.item_name}</h2>
                <p className="text-sm text-slate-600 capitalize">{selectedFoodItem.category}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={modalQuantity}
                  onChange={(e) => setModalQuantity(Number(e.target.value))}
                  min="1"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={modalPurchaseDate}
                    onChange={(e) => handlePurchaseDateChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={modalExpirationDate}
                    onChange={(e) => setModalExpirationDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
                  placeholder="Additional notes..."
                />
              </div>

              <button
                onClick={handleAddFromCodex}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add to My Inventory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
