import { getCategoryData, calculateExpectedWaste } from "../utils/category-weights";

export interface WasteEstimate {
    estimated_grams: number;
    estimated_cost: number;
    confidence_score: number;
    breakdown_by_category: CategoryWaste[];
}

export interface CategoryWaste {
    category: string;
    estimated_grams: number;
    estimated_cost: number;
}

export interface WasteProjection {
    estimate_type: "weekly" | "monthly";
    estimated_grams: number;
    estimated_cost: number;
    confidence_score: number;
    projection_date: string;
}

export interface WastePattern {
    pattern_type: string;
    description: string;
    frequency: number;
}

/**
 * Waste estimator service using predictive formulas
 */
export class WasteEstimator {
    private sql: any;

    constructor(sql: any) {
        this.sql = sql;
    }

    /**
     * Estimate current waste based on inventory and risk scores
     */
    async estimateCurrentWaste(userId: number): Promise<WasteEstimate> {
        try {
            // Get inventory items with high risk scores
            const highRiskItems = await this.sql`
        SELECT 
          ui.id,
          ui.item_name,
          ui.category,
          ui.quantity,
          ui.expiration_date,
          COALESCE(ers.risk_score, 50) as risk_score,
          fi.cost_per_unit
        FROM user_inventory ui
        LEFT JOIN expiration_risk_scores ers ON ui.id = ers.inventory_item_id
        LEFT JOIN food_inventory fi ON LOWER(ui.item_name) = LOWER(fi.item_name)
        WHERE ui.user_id = ${userId}
      `;

            let totalGrams = 0;
            let totalCost = 0;
            const categoryBreakdown: Map<string, CategoryWaste> = new Map();

            for (const item of highRiskItems) {
                // Calculate days until expiry
                const daysUntilExpiry = item.expiration_date
                    ? Math.ceil((new Date(item.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 100;

                // Get category waste rate
                const categoryData = getCategoryData(item.category || "");

                // Estimate waste probability
                let wasteProbability = item.risk_score / 100;
                let actualWasteRate = categoryData.wasteRate;

                // CRITICAL FIX: If item is already expired, it is 100% waste
                if (daysUntilExpiry <= 0) {
                    wasteProbability = 1.0;
                    actualWasteRate = 1.0; // Entire item is wasted
                }

                // Calculate estimated waste for this item
                // Assuming quantity is in units, convert to approximate grams
                const gramsPerUnit = this.estimateGramsPerUnit(item.category || "");
                const totalGrams_item = item.quantity * gramsPerUnit;
                const estimatedWasteGrams = totalGrams_item * wasteProbability * actualWasteRate;

                // Calculate cost
                const costPerUnit = parseFloat(item.cost_per_unit || "0");
                const estimatedCost = item.quantity * costPerUnit * wasteProbability * actualWasteRate;

                totalGrams += estimatedWasteGrams;
                totalCost += estimatedCost;

                // Add to category breakdown
                const existing = categoryBreakdown.get(item.category);
                if (existing) {
                    existing.estimated_grams += estimatedWasteGrams;
                    existing.estimated_cost += estimatedCost;
                } else {
                    categoryBreakdown.set(item.category, {
                        category: item.category,
                        estimated_grams: estimatedWasteGrams,
                        estimated_cost: estimatedCost,
                    });
                }
            }

            // Calculate confidence score based on data availability
            const confidenceScore = this.calculateConfidence(highRiskItems.length);

            return {
                estimated_grams: Math.round(totalGrams),
                estimated_cost: Math.round(totalCost * 100) / 100,
                confidence_score: confidenceScore,
                breakdown_by_category: Array.from(categoryBreakdown.values()),
            };
        } catch (error) {
            console.error("Error estimating current waste:", error);
            throw error;
        }
    }

    /**
     * Estimate grams per unit based on category (rough approximation)
     */
    private estimateGramsPerUnit(category: string): number {
        const estimates: Record<string, number> = {
            Fruit: 150, // avg apple/banana
            Vegetable: 100,
            Dairy: 200, // milk carton unit
            Grain: 500, // rice package
            Protein: 200,
            Nuts: 50,
            Spread: 150,
            Beverage: 250,
        };
        return estimates[category] || 100;
    }

    /**
     * Calculate confidence score based on data availability
     */
    private calculateConfidence(itemCount: number): number {
        if (itemCount >= 20) return 85;
        if (itemCount >= 10) return 70;
        if (itemCount >= 5) return 55;
        return 40;
    }

    /**
     * Get weekly waste projection
     */
    async getWeeklyProjection(userId: number): Promise<WasteProjection> {
        try {
            const currentEstimate = await this.estimateCurrentWaste(userId);

            // Project for next 7 days based on current trends
            const projectionDate = new Date();
            projectionDate.setDate(projectionDate.getDate() + 7);

            // Check if projection already exists
            const existing = await this.sql`
        SELECT * FROM waste_estimates
        WHERE user_id = ${userId}
          AND estimate_type = 'weekly'
          AND projection_date >= CURRENT_DATE
        ORDER BY created_at DESC
        LIMIT 1
      `;

            if (existing.length > 0) {
                return {
                    estimate_type: "weekly",
                    estimated_grams: parseFloat(existing[0].estimated_grams),
                    estimated_cost: parseFloat(existing[0].estimated_cost),
                    confidence_score: parseFloat(existing[0].confidence_score),
                    projection_date: existing[0].projection_date,
                };
            }

            // Create new projection
            const projection: WasteProjection = {
                estimate_type: "weekly",
                estimated_grams: currentEstimate.estimated_grams,
                estimated_cost: currentEstimate.estimated_cost,
                confidence_score: currentEstimate.confidence_score,
                projection_date: projectionDate.toISOString().split("T")[0],
            };

            // Save to database
            await this.sql`
        INSERT INTO waste_estimates (
          user_id,
          estimate_type,
          estimated_grams,
          estimated_cost,
          confidence_score,
          projection_date
        ) VALUES (
          ${userId},
          ${projection.estimate_type},
          ${projection.estimated_grams},
          ${projection.estimated_cost},
          ${projection.confidence_score},
          ${projection.projection_date}
        )
      `;

            return projection;
        } catch (error) {
            console.error("Error getting weekly projection:", error);
            throw error;
        }
    }

    /**
     * Get monthly waste projection
     */
    async getMonthlyProjection(userId: number): Promise<WasteProjection> {
        try {
            const weeklyProjection = await this.getWeeklyProjection(userId);

            // Monthly = weekly * 4.3 (average weeks per month)
            const projectionDate = new Date();
            projectionDate.setDate(projectionDate.getDate() + 30);

            const projection: WasteProjection = {
                estimate_type: "monthly",
                estimated_grams: Math.round(weeklyProjection.estimated_grams * 4.3),
                estimated_cost: Math.round(weeklyProjection.estimated_cost * 4.3 * 100) / 100,
                confidence_score: weeklyProjection.confidence_score - 5, // Slightly lower confidence for longer projection
                projection_date: projectionDate.toISOString().split("T")[0],
            };

            // Save to database
            await this.sql`
        INSERT INTO waste_estimates (
          user_id,
          estimate_type,
          estimated_grams,
          estimated_cost,
          confidence_score,
          projection_date
        ) VALUES (
          ${userId},
          ${projection.estimate_type},
          ${projection.estimated_grams},
          ${projection.estimated_cost},
          ${projection.confidence_score},
          ${projection.projection_date}
        )
      `;

            return projection;
        } catch (error) {
            console.error("Error getting monthly projection:", error);
            throw error;
        }
    }

    /**
     * Analyze waste patterns from historical data
     */
    async analyzeWastePatterns(userId: number): Promise<WastePattern[]> {
        try {
            const patterns: WastePattern[] = [];

            // Get waste records from last 90 days
            const wasteRecords = await this.sql`
        SELECT 
          category,
          reason,
          COUNT(*) as count,
          SUM(quantity_grams) as total_grams
        FROM waste_records
        WHERE user_id = ${userId}
          AND wasted_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY category, reason
        ORDER BY count DESC
      `;

            // Analyze category patterns
            const categoryMap = new Map<string, number>();
            for (const record of wasteRecords) {
                const existing = categoryMap.get(record.category) || 0;
                categoryMap.set(record.category, existing + parseInt(record.count));
            }

            categoryMap.forEach((count, category) => {
                if (count >= 3) {
                    patterns.push({
                        pattern_type: "category_waste",
                        description: `You tend to waste ${category} items frequently`,
                        frequency: count,
                    });
                }
            });

            // Analyze reason patterns
            const reasonMap = new Map<string, number>();
            for (const record of wasteRecords) {
                if (record.reason) {
                    const existing = reasonMap.get(record.reason) || 0;
                    reasonMap.set(record.reason, existing + parseInt(record.count));
                }
            }

            reasonMap.forEach((count, reason) => {
                if (count >= 2) {
                    patterns.push({
                        pattern_type: "waste_reason",
                        description: `Common waste reason: ${reason}`,
                        frequency: count,
                    });
                }
            });

            return patterns;
        } catch (error) {
            console.error("Error analyzing waste patterns:", error);
            return [];
        }
    }

    /**
     * Record actual waste for learning
     */
    async recordWaste(
        userId: number,
        itemName: string,
        category: string,
        quantityGrams: number,
        costWasted: number,
        reason?: string
    ): Promise<void> {
        try {
            await this.sql`
        INSERT INTO waste_records (
          user_id,
          item_name,
          category,
          quantity_grams,
          cost_wasted,
          reason,
          wasted_date
        ) VALUES (
          ${userId},
          ${itemName},
          ${category},
          ${quantityGrams},
          ${costWasted},
          ${reason || "not_specified"},
          CURRENT_DATE
        )
      `;
        } catch (error) {
            console.error("Error recording waste:", error);
            throw error;
        }
    }
    /**
     * Get historical waste statistics
     */
    async getHistoricalWasteStats(userId: number): Promise<{ total_grams: number; total_cost: number }> {
        try {
            // 1. Get recorded waste
            const recordedResult = await this.sql`
                SELECT 
                    COALESCE(SUM(quantity_grams), 0) as total_grams,
                    COALESCE(SUM(cost_wasted), 0) as total_cost
                FROM waste_records
                WHERE user_id = ${userId}
            `;

            // 2. Get currently expired inventory (that hasn't been recorded yet)
            // We join with food_inventory to get cost if possible, or estimate
            const expiredResult = await this.sql`
                SELECT 
                    ui.quantity,
                    ui.category,
                    fi.cost_per_unit
                FROM user_inventory ui
                LEFT JOIN food_inventory fi ON LOWER(ui.item_name) = LOWER(fi.item_name)
                WHERE ui.user_id = ${userId} 
                AND ui.expiration_date <= CURRENT_DATE
            `;

            let expiredGrams = 0;
            let expiredCost = 0;

            for (const item of expiredResult) {
                const gramsPerUnit = this.estimateGramsPerUnit(item.category || "");
                expiredGrams += item.quantity * gramsPerUnit;

                const costPerUnit = parseFloat(item.cost_per_unit || "0");
                // If no cost found, estimate based on category avg (simplified)
                const estimatedCost = costPerUnit > 0 ? costPerUnit : 2.0;
                expiredCost += item.quantity * estimatedCost;
            }

            return {
                total_grams: Math.round(parseFloat(recordedResult[0].total_grams) + expiredGrams),
                total_cost: parseFloat(recordedResult[0].total_cost) + expiredCost
            };
        } catch (error) {
            console.error("Error getting historical waste stats:", error);
            return { total_grams: 0, total_cost: 0 };
        }
    }
}
