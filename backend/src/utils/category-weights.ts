/**
 * Category-based risk and waste factors
 * Used for AI expiration risk prediction and waste estimation
 */

export interface CategoryData {
    riskFactor: number; // Multiplier for expiration risk (higher = expires faster)
    wasteRate: number; // Expected waste percentage (0-1)
    avgShelfLifeDays: number; // Average shelf life in days
}

export const CATEGORY_WEIGHTS: Record<string, CategoryData> = {
    Fruit: {
        riskFactor: 1.5,
        wasteRate: 0.30, // 30% typically wasted
        avgShelfLifeDays: 7,
    },
    Vegetable: {
        riskFactor: 1.3,
        wasteRate: 0.25,
        avgShelfLifeDays: 7,
    },
    Dairy: {
        riskFactor: 1.2,
        wasteRate: 0.15,
        avgShelfLifeDays: 10,
    },
    Grain: {
        riskFactor: 0.5,
        wasteRate: 0.05,
        avgShelfLifeDays: 180,
    },
    Protein: {
        riskFactor: 1.4,
        wasteRate: 0.20,
        avgShelfLifeDays: 5,
    },
    Nuts: {
        riskFactor: 0.6,
        wasteRate: 0.08,
        avgShelfLifeDays: 90,
    },
    Spread: {
        riskFactor: 0.7,
        wasteRate: 0.10,
        avgShelfLifeDays: 90,
    },
    Beverage: {
        riskFactor: 1.0,
        wasteRate: 0.12,
        avgShelfLifeDays: 14,
    },
};

// Default for unknown categories
export const DEFAULT_CATEGORY: CategoryData = {
    riskFactor: 1.0,
    wasteRate: 0.15,
    avgShelfLifeDays: 14,
};

/**
 * Get category data with fallback to default
 */
export function getCategoryData(category: string): CategoryData {
    return CATEGORY_WEIGHTS[category] || DEFAULT_CATEGORY;
}

/**
 * Calculate expected waste in grams for a given quantity and category
 */
export function calculateExpectedWaste(
    category: string,
    quantityGrams: number
): number {
    const data = getCategoryData(category);
    return quantityGrams * data.wasteRate;
}

/**
 * Get all categories with their data
 */
export function getAllCategories(): Array<{ name: string; data: CategoryData }> {
    return Object.entries(CATEGORY_WEIGHTS).map(([name, data]) => ({
        name,
        data,
    }));
}
