/**
 * Seasonality calculator for expiration risk
 * Provides seasonal adjustment factors based on item category and current month
 */

export type Season = "spring" | "summer" | "fall" | "winter";

export interface SeasonalFactor {
    season: Season;
    multiplier: number;
    description: string;
}

/**
 * Get the current season based on month (Northern Hemisphere)
 */
export function getCurrentSeason(date: Date = new Date()): Season {
    const month = date.getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "fall";
    return "winter";
}

/**
 * Seasonal adjustment rules (dummy implementation)
 */
const SEASONAL_RULES: Record<
    string,
    Record<Season, number>
> = {
    Fruit: {
        spring: 1.1, // Slightly faster expiration
        summer: 1.3, // Much faster in warm weather
        fall: 1.0,   // Normal
        winter: 0.9, // Slower in cold
    },
    Vegetable: {
        spring: 1.0,
        summer: 1.2, // Faster in heat
        fall: 1.0,
        winter: 0.9,
    },
    Dairy: {
        spring: 1.0,
        summer: 1.2, // Spoils faster when warm
        fall: 1.0,
        winter: 1.0,
    },
    Protein: {
        spring: 1.0,
        summer: 1.3, // Very sensitive to heat
        fall: 1.0,
        winter: 0.95,
    },
    Grain: {
        spring: 1.0,
        summer: 1.0, // Stable
        fall: 1.0,
        winter: 1.0,
    },
    Nuts: {
        spring: 1.0,
        summer: 1.05, // Slight increase
        fall: 1.0,
        winter: 1.0,
    },
    Spread: {
        spring: 1.0,
        summer: 1.1,
        fall: 1.0,
        winter: 1.0,
    },
    Beverage: {
        spring: 1.0,
        summer: 1.1,
        fall: 1.0,
        winter: 1.0,
    },
};

/**
 * Get seasonal factor for a category
 */
export function getSeasonalityFactor(
    category: string,
    date: Date = new Date()
): SeasonalFactor {
    const season = getCurrentSeason(date);
    const categoryRules = SEASONAL_RULES[category];

    if (!categoryRules) {
        // Default: no seasonal adjustment
        return {
            season,
            multiplier: 1.0,
            description: "No seasonal adjustment for this category",
        };
    }

    const multiplier = categoryRules[season];

    let description = "";
    if (multiplier > 1.0) {
        description = `${category} expires ${((multiplier - 1) * 100).toFixed(0)}% faster in ${season}`;
    } else if (multiplier < 1.0) {
        description = `${category} lasts ${((1 - multiplier) * 100).toFixed(0)}% longer in ${season}`;
    } else {
        description = `Normal expiration rate for ${category} in ${season}`;
    }

    return { season, multiplier, description };
}

/**
 * Get seasonal description for display
 */
export function getSeasonalDescription(season: Season): string {
    const descriptions: Record<Season, string> = {
        spring: "Spring (Mar-May): Moderate temperatures",
        summer: "Summer (Jun-Aug): Hot weather accelerates spoilage",
        fall: "Fall (Sep-Nov): Cool temperatures",
        winter: "Winter (Dec-Feb): Cold weather slows spoilage",
    };

    return descriptions[season];
}
