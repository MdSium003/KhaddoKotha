"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import {
    getFoodUsageLogs,
    createFoodUsageLog,
    bulkCreateFoodUsageLogs,
    fetchFoodInventory,
    uploadImage,
    extractTextFromImage,
    type FoodUsageLog,
    type FoodUsageLogData,
    type FoodInventoryItem,
    type OCRResponse,
} from "@/lib/api";

export default function DailyTrackerPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [usageDate, setUsageDate] = useState(new Date().toISOString().split("T")[0]);
    const [foodUsageMethod, setFoodUsageMethod] = useState<"manual" | "dropdown" | "csv" | "ocr">("manual");
    const [manualEntries, setManualEntries] = useState<FoodUsageLogData[]>([
        { itemName: "", quantity: 1, category: "", imageUrl: "" },
    ]);
    const [manualEntryImages, setManualEntryImages] = useState<(File | null)[]>([null]);
    const [uploadingImages, setUploadingImages] = useState<boolean[]>([false]);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<number | "">("");
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [uploadingSelectedImage, setUploadingSelectedImage] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [foodUsageLogs, setFoodUsageLogs] = useState<FoodUsageLog[]>([]);
    const [inventoryItems, setInventoryItems] = useState<FoodInventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [csvLoading, setCsvLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // OCR state for daily tracker
    const [ocrFileDaily, setOcrFileDaily] = useState<File | null>(null);
    const [ocrLoadingDaily, setOcrLoadingDaily] = useState(false);
    const [ocrResultDaily, setOcrResultDaily] = useState<OCRResponse | null>(null);
    const [showOcrModalDaily, setShowOcrModalDaily] = useState(false);
    const [ocrExtractedLogs, setOcrExtractedLogs] = useState<FoodUsageLogData[]>([]);
    const [ocrProgressDaily, setOcrProgressDaily] = useState(0);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadFoodUsageLogs();
            loadInventoryItems();
        }
    }, [user, usageDate]);

    const loadFoodUsageLogs = async () => {
        try {
            const logs = await getFoodUsageLogs(usageDate);
            setFoodUsageLogs(logs);
        } catch (error) {
            console.error("Failed to load food usage logs:", error);
        }
    };

    const loadInventoryItems = async () => {
        try {
            const items = await fetchFoodInventory();
            setInventoryItems(items);
        } catch (error) {
            console.error("Failed to load inventory items:", error);
        }
    };

    const handleAddManualEntry = () => {
        setManualEntries([...manualEntries, { itemName: "", quantity: 1, category: "", imageUrl: "" }]);
        setManualEntryImages([...manualEntryImages, null]);
    };

    const handleRemoveManualEntry = (index: number) => {
        setManualEntries(manualEntries.filter((_, i) => i !== index));
        setManualEntryImages(manualEntryImages.filter((_, i) => i !== index));
    };

    const handleManualEntryChange = (
        index: number,
        field: keyof FoodUsageLogData,
        value: string | number
    ) => {
        const updated = [...manualEntries];
        updated[index] = { ...updated[index], [field]: value };
        setManualEntries(updated);
    };

    const handleImageChange = async (index: number, file: File | null) => {
        if (!file) {
            const updatedImages = [...manualEntryImages];
            updatedImages[index] = null;
            setManualEntryImages(updatedImages);
            return;
        }

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            setError("Please upload a JPG or PNG image");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB");
            return;
        }

        const updatedUploading = [...uploadingImages];
        updatedUploading[index] = true;
        setUploadingImages(updatedUploading);

        try {
            const imageUrl = await uploadImage(file);
            const updatedEntries = [...manualEntries];
            updatedEntries[index] = { ...updatedEntries[index], imageUrl };
            setManualEntries(updatedEntries);

            const updatedImages = [...manualEntryImages];
            updatedImages[index] = file;
            setManualEntryImages(updatedImages);
        } catch (error: any) {
            setError(error.message || "Failed to upload image");
        } finally {
            const updatedUploading = [...uploadingImages];
            updatedUploading[index] = false;
            setUploadingImages(updatedUploading);
        }
    };

    const handleSelectedImageChange = async (file: File | null) => {
        if (!file) {
            setSelectedImage(null);
            setSelectedImageUrl("");
            return;
        }

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            setError("Please upload a JPG or PNG image");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB");
            return;
        }

        setUploadingSelectedImage(true);
        try {
            const imageUrl = await uploadImage(file);
            setSelectedImage(file);
            setSelectedImageUrl(imageUrl);
        } catch (error: any) {
            setError(error.message || "Failed to upload image");
        } finally {
            setUploadingSelectedImage(false);
        }
    };

    // OCR Functions for daily tracker
    const handleOcrExtractDaily = async () => {
        if (!ocrFileDaily) {
            setError("Please select an image file");
            return;
        }

        setOcrLoadingDaily(true);
        setError("");
        setOcrProgressDaily(0);

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setOcrProgressDaily((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const result = await extractTextFromImage(ocrFileDaily);
            clearInterval(progressInterval);
            setOcrProgressDaily(100);
            setOcrResultDaily(result);

            // Process extracted data into usage logs
            const logs: FoodUsageLogData[] = [];

            for (let i = 0; i < result.extractedItems.length; i++) {
                const extractedItem = result.extractedItems[i];
                // Find matching quantity
                let quantity = extractedItem.quantity || 1;

                if (!extractedItem.quantity && i < result.extractedQuantities.length) {
                    quantity = parseFloat(result.extractedQuantities[i].value) || 1;
                }

                // Try to determine category from item name
                const lowerName = extractedItem.name.toLowerCase();
                let category = "other";
                if (lowerName.includes("milk") || lowerName.includes("cheese") || lowerName.includes("yogurt") || lowerName.includes("dairy")) {
                    category = "dairy";
                } else if (lowerName.includes("apple") || lowerName.includes("banana") || lowerName.includes("orange") || lowerName.includes("fruit")) {
                    category = "fruits";
                } else if (lowerName.includes("tomato") || lowerName.includes("carrot") || lowerName.includes("potato") || lowerName.includes("vegetable")) {
                    category = "vegetables";
                } else if (lowerName.includes("bread") || lowerName.includes("rice") || lowerName.includes("pasta") || lowerName.includes("grain")) {
                    category = "grains";
                } else if (lowerName.includes("chicken") || lowerName.includes("beef") || lowerName.includes("pork") || lowerName.includes("fish") || lowerName.includes("meat")) {
                    category = "meat";
                }

                logs.push({
                    itemName: extractedItem.name,
                    quantity,
                    category,
                    usageDate,
                    imageUrl: undefined, // Can be added later if needed
                });
            }

            setOcrExtractedLogs(logs);
            setShowOcrModalDaily(true);
            setOcrProgressDaily(0);
        } catch (error: any) {
            setError(error.message || "Failed to extract text from image");
            setOcrProgressDaily(0);
        } finally {
            setOcrLoadingDaily(false);
        }
    };

    const handleOcrLogsChange = (index: number, field: keyof FoodUsageLogData, value: string | number) => {
        const updated = [...ocrExtractedLogs];
        updated[index] = { ...updated[index], [field]: value };
        setOcrExtractedLogs(updated);
    };

    const handleOcrRemoveLog = (index: number) => {
        setOcrExtractedLogs(ocrExtractedLogs.filter((_, i) => i !== index));
    };

    const handleAddOcrLogs = async () => {
        if (ocrExtractedLogs.length === 0) {
            setError("No items to add");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await bulkCreateFoodUsageLogs(ocrExtractedLogs);
            setSuccess(`Successfully logged ${ocrExtractedLogs.length} food usage entries from OCR!`);
            setShowOcrModalDaily(false);
            setOcrFileDaily(null);
            setOcrResultDaily(null);
            setOcrExtractedLogs([]);
            await loadFoodUsageLogs();
        } catch (error: any) {
            setError(error.message || "Failed to add logs");
        } finally {
            setLoading(false);
        }
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

            const entriesWithImageUrls = entriesWithDate.map((entry) => ({
                ...entry,
                imageUrl: entry.imageUrl || undefined,
            }));
            await bulkCreateFoodUsageLogs(entriesWithImageUrls);
            setSuccess(`Successfully logged ${validEntries.length} food usage entries!`);
            setManualEntries([{ itemName: "", quantity: 1, category: "", imageUrl: "" }]);
            setManualEntryImages([null]);
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
                imageUrl: selectedImageUrl || undefined,
            });

            setSuccess("Food usage logged successfully!");
            setSelectedInventoryItem("");
            setSelectedQuantity(1);
            setSelectedImage(null);
            setSelectedImageUrl("");
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
                const entry: FoodUsageLogData = {
                    itemName: values[itemNameIndex],
                    quantity: parseFloat(values[quantityIndex]),
                    category: values[categoryIndex],
                    usageDate,
                };
                if (entry.itemName && entry.quantity && entry.category) {
                    entries.push(entry);
                }
            }

            if (entries.length === 0) {
                throw new Error("No valid entries found in CSV");
            }

            await bulkCreateFoodUsageLogs(entries);
            setSuccess(`Successfully uploaded ${entries.length} entries!`);
            setCsvFile(null);
            await loadFoodUsageLogs();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload CSV");
        } finally {
            setCsvLoading(false);
        }
    };

    // Calculate statistics
    const totalItems = foodUsageLogs.length;
    const totalQuantity = foodUsageLogs.reduce((sum, log) => sum + log.quantity, 0);
    const categories = [...new Set(foodUsageLogs.map(log => log.category))];

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
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">Daily Food Tracker</h1>
                            <p className="text-slate-600">Monitor and log your daily food consumption</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700">Total Items</p>
                                    <p className="text-3xl font-bold text-emerald-900 mt-1">{totalItems}</p>
                                </div>
                                <div className="p-3 bg-emerald-200 rounded-xl">
                                    <svg className="w-8 h-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-700">Total Quantity</p>
                                    <p className="text-3xl font-bold text-blue-900 mt-1">{totalQuantity.toFixed(1)}</p>
                                </div>
                                <div className="p-3 bg-blue-200 rounded-xl">
                                    <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-700">Categories</p>
                                    <p className="text-3xl font-bold text-orange-900 mt-1">{categories.length}</p>
                                </div>
                                <div className="p-3 bg-orange-200 rounded-xl">
                                    <svg className="w-8 h-8 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl bg-red-100 border border-red-300 p-4 flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="rounded-2xl bg-green-100 border border-green-300 p-4 flex items-center gap-3">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-green-800">{success}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Input Methods */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Date Selection Card */}
                            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Select Date</label>
                                        <p className="text-xs text-slate-500">Choose the date for logging food usage</p>
                                    </div>
                                </div>
                                <input
                                    type="date"
                                    value={usageDate}
                                    onChange={(e) => setUsageDate(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition"
                                />
                            </div>

                            {/* Method Selection Card */}
                            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Log Food Usage</h3>
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    <button
                                        onClick={() => setFoodUsageMethod("manual")}
                                        className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold transition-all ${foodUsageMethod === "manual"
                                            ? "bg-emerald-600 text-white shadow-lg scale-105"
                                            : "border-2 border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Manual
                                    </button>
                                    <button
                                        onClick={() => setFoodUsageMethod("dropdown")}
                                        className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold transition-all ${foodUsageMethod === "dropdown"
                                            ? "bg-emerald-600 text-white shadow-lg scale-105"
                                            : "border-2 border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        Inventory
                                    </button>
                                    <button
                                        onClick={() => setFoodUsageMethod("csv")}
                                        className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold transition-all ${foodUsageMethod === "csv"
                                            ? "bg-emerald-600 text-white shadow-lg scale-105"
                                            : "border-2 border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => setFoodUsageMethod("ocr")}
                                        className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold transition-all ${foodUsageMethod === "ocr"
                                            ? "bg-emerald-600 text-white shadow-lg scale-105"
                                            : "border-2 border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        📷 OCR
                                    </button>
                                </div>

                                {/* Manual Entry Form */}
                                {foodUsageMethod === "manual" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-700">Manual Entry</h4>
                                            <button
                                                onClick={handleAddManualEntry}
                                                className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {manualEntries.map((entry, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 space-y-3"
                                                >
                                                    <div className="grid gap-3 md:grid-cols-[2fr,1fr,2fr,auto]">
                                                        <input
                                                            type="text"
                                                            placeholder="Item name"
                                                            value={entry.itemName}
                                                            onChange={(e) =>
                                                                handleManualEntryChange(index, "itemName", e.target.value)
                                                            }
                                                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Qty"
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
                                                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Category"
                                                            value={entry.category}
                                                            onChange={(e) =>
                                                                handleManualEntryChange(index, "category", e.target.value)
                                                            }
                                                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                        />
                                                        {manualEntries.length > 1 && (
                                                            <button
                                                                onClick={() => handleRemoveManualEntry(index)}
                                                                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700 transition hover:bg-red-100"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                            Upload Image (Receipt/Label) - JPG/PNG
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="file"
                                                                accept="image/jpeg,image/jpg,image/png"
                                                                onChange={(e) => handleImageChange(index, e.target.files?.[0] || null)}
                                                                className="hidden"
                                                                id={`daily-image-upload-${index}`}
                                                            />
                                                            <label
                                                                htmlFor={`daily-image-upload-${index}`}
                                                                className="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition"
                                                            >
                                                                {uploadingImages[index] ? "Uploading..." : manualEntryImages[index] ? manualEntryImages[index]!.name : "Choose Image"}
                                                            </label>
                                                            {entry.imageUrl && (
                                                                <img
                                                                    src={entry.imageUrl}
                                                                    alt="Preview"
                                                                    className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={handleSubmitManualEntries}
                                                disabled={loading}
                                                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? "Saving..." : "Save Entries"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Dropdown Selection */}
                                {foodUsageMethod === "dropdown" && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-700">Select from Inventory</h4>
                                        <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
                                            <select
                                                value={selectedInventoryItem}
                                                onChange={(e) => setSelectedInventoryItem(Number(e.target.value) || "")}
                                                className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
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
                                                className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                            />
                                            <button
                                                onClick={handleInventoryItemSelect}
                                                disabled={loading || !selectedInventoryItem}
                                                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? "Adding..." : "Add"}
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Upload Image (Receipt/Label) - JPG/PNG
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    onChange={(e) => handleSelectedImageChange(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="dropdown-image-upload"
                                                />
                                                <label
                                                    htmlFor="dropdown-image-upload"
                                                    className="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition"
                                                >
                                                    {uploadingSelectedImage ? "Uploading..." : selectedImage ? selectedImage.name : "Choose Image"}
                                                </label>
                                                {selectedImageUrl && (
                                                    <img
                                                        src={selectedImageUrl}
                                                        alt="Preview"
                                                        className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CSV Upload */}
                                {foodUsageMethod === "csv" && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-700">Upload CSV File</h4>
                                        <div className="space-y-3">
                                            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                                <input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="csv-upload"
                                                />
                                                <label htmlFor="csv-upload" className="cursor-pointer">
                                                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-sm font-semibold text-slate-700 mb-1">
                                                        {csvFile ? csvFile.name : "Click to upload CSV"}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Format: item_name, quantity, category
                                                    </p>
                                                </label>
                                            </div>
                                            <button
                                                onClick={handleCsvUpload}
                                                disabled={csvLoading || !csvFile}
                                                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {csvLoading ? "Uploading..." : "Upload CSV"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* OCR Scan */}
                                {foodUsageMethod === "ocr" && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-700">Scan Receipt/Food Label</h4>
                                        <div className="space-y-3">
                                            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    onChange={(e) => setOcrFileDaily(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="ocr-upload-daily"
                                                />
                                                <label htmlFor="ocr-upload-daily" className="cursor-pointer">
                                                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <p className="text-sm font-semibold text-slate-700 mb-1">
                                                        {ocrFileDaily ? ocrFileDaily.name : "Upload Receipt or Food Label"}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Extract items and quantities automatically from your receipt
                                                    </p>
                                                    {ocrFileDaily && (
                                                        <div className="mt-4">
                                                            <img
                                                                src={URL.createObjectURL(ocrFileDaily)}
                                                                alt="Preview"
                                                                className="max-w-full max-h-48 mx-auto rounded-lg border border-slate-300"
                                                            />
                                                        </div>
                                                    )}
                                                </label>
                                            </div>

                                            {ocrLoadingDaily && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                                        <span>Extracting text from image...</span>
                                                        <span>{Math.round(ocrProgressDaily)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                                        <div
                                                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${ocrProgressDaily}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={handleOcrExtractDaily}
                                                disabled={ocrLoadingDaily || !ocrFileDaily}
                                                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {ocrLoadingDaily ? "Scanning Image..." : "Extract with OCR"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Today's Logs */}
                        <div className="lg:col-span-1">
                            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-lg sticky top-28">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Today's Logs</h3>
                                        <p className="text-xs text-slate-500">{new Date(usageDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                {foodUsageLogs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-slate-500 text-sm font-medium">No logs for this date</p>
                                        <p className="text-slate-400 text-xs mt-1">Start logging your food usage</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                        {foodUsageLogs.map((log, index) => (
                                            <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition">
                                                <div className="flex items-start justify-between mb-1">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-900 text-sm">{log.itemName}</h4>
                                                        <p className="text-xs text-slate-500 capitalize">{log.category}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-emerald-600 text-sm">{log.quantity}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {log.imageUrl && (
                                                    <div className="mt-2">
                                                        <img
                                                            src={log.imageUrl}
                                                            alt={log.itemName}
                                                            className="w-full h-24 object-cover rounded-lg border border-slate-300"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                <SiteFooter />
            </div>


            {/* Modal for OCR extracted logs confirmation */}
            {showOcrModalDaily && ocrResultDaily && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Review Extracted Food Usage</h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    {ocrResultDaily.summary} • Please review and edit the extracted data before adding.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowOcrModalDaily(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {ocrExtractedLogs.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-600 mb-4">No items could be extracted from the image.</p>
                                <p className="text-sm text-slate-500 mb-4">Extracted text:</p>
                                <div className="bg-slate-50 p-4 rounded-lg text-left text-sm text-slate-600 max-h-40 overflow-y-auto">
                                    {ocrResultDaily.fullText || "No text found"}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                {ocrExtractedLogs.map((log, index) => (
                                    <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-slate-700">Entry {index + 1}</h3>
                                            <button
                                                onClick={() => handleOcrRemoveLog(index)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Item Name"
                                            value={log.itemName}
                                            onChange={(e) => handleOcrLogsChange(index, "itemName", e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder="Quantity"
                                                value={log.quantity}
                                                onChange={(e) => handleOcrLogsChange(index, "quantity", parseFloat(e.target.value) || 0)}
                                                min="0.01"
                                                step="0.01"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Category"
                                                value={log.category}
                                                onChange={(e) => handleOcrLogsChange(index, "category", e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOcrModalDaily(false)}
                                className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddOcrLogs}
                                disabled={loading || ocrExtractedLogs.length === 0}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {loading ? "Adding..." : `Add ${ocrExtractedLogs.length} Entry(ies)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
