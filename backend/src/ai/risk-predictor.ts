import { neon } from "@neondatabase/serverless";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCategoryData } from "../utils/category-weights";
import { getSeasonalityFactor } from "../utils/seasonality-calculator";

export interface InventoryItem {
    id: number;
    user_id: number;
    item_name: string;
    quantity: number;
    category: string;
    purchase_date?: string;
    expiration_date?: string;
    notes?: string;
}

export interface RiskScore {
    inventory_item_id: number;
    risk_score: number;
    priority_rank?: number;
    consumption_frequency?: number;
    category_risk_factor: number;
    seasonal_factor: number;
    explanation: string;
    days_until_expiry?: number;
}

/**
 * AI-powered expiration risk predictor
 * Uses consumption patterns, category weights, and seasonality
 */
export class RiskPredictor {
    private sql: any;
    private genAI: GoogleGenerativeAI | null;

    constructor(sql: any, genAI: GoogleGenerativeAI | null) {
        this.sql = sql;
        this.genAI = genAI;
    }

    /**
     * Calculate expiration risk for a single inventory item
     */
    async calculateExpirationRisk(
        userId: number,
        inventoryItem: InventoryItem
    ): Promise<RiskScore> {
        // Get consumption frequency from food_usage_logs
        const consumptionFreq = await this.getConsumptionFrequency(
            userId,
            inventoryItem.item_name
        );

        // Get category risk factor
        const categoryData = getCategoryData(inventoryItem.category);
        const categoryRiskFactor = categoryData.riskFactor;

        // Get seasonal factor
        const seasonalData = getSeasonalityFactor(inventoryItem.category);
        const seasonalFactor = seasonalData.multiplier;

        // Calculate days until expiry
        const daysUntilExpiry = inventoryItem.expiration_date
            ? this.calculateDaysUntilExpiry(inventoryItem.expiration_date)
            : categoryData.avgShelfLifeDays;

        // Calculate base risk score (0-100)
        let riskScore = this.calculateBaseRiskScore(
            daysUntilExpiry,
            consumptionFreq,
            categoryRiskFactor,
            seasonalFactor,
            inventoryItem.quantity
        );

        // Clamp to 0-100
        riskScore = Math.max(0, Math.min(100, riskScore));

        // Generate explanation using AI if available
        const explanation = await this.generateRiskExplanation(
            inventoryItem,
            riskScore,
            daysUntilExpiry,
            consumptionFreq,
            seasonalData.description
        );

        return {
            inventory_item_id: inventoryItem.id,
            risk_score: riskScore,
            consumption_frequency: consumptionFreq,
            category_risk_factor: categoryRiskFactor,
            seasonal_factor: seasonalFactor,
            explanation,
            days_until_expiry: daysUntilExpiry,
        };
    }

    /**
     * Calculate base risk score using formula
     * Higher score = higher risk of expiration/waste
     */
    private calculateBaseRiskScore(
        daysUntilExpiry: number,
        consumptionFreq: number,
        categoryRisk: number,
        seasonalFactor: number,
        quantity: number
    ): number {
        // Base formula: 
        // - Close to expiry = higher risk
        // - Low consumption frequency = higher risk
        // - High category risk = higher risk
        // - Seasonal factors adjust risk
        // - Large quantity harder to consume = higher risk

        // CRITICAL FIX: If item is already expired, risk is 100%
        if (daysUntilExpiry <= 0) {
            return 100;
        }

        const expiryUrgency = Math.max(0, 100 - daysUntilExpiry * 3);
        const consumptionRisk = consumptionFreq < 0.5 ? 80 : Math.max(0, 100 - consumptionFreq * 20);
        const quantityRisk = quantity > 5 ? 20 : 0;

        const baseScore =
            (expiryUrgency * 0.5 + consumptionRisk * 0.3 + quantityRisk * 0.2) *
            categoryRisk *
            seasonalFactor;

        return Math.round(baseScore);
    }

    /**
     * Get consumption frequency (times per week) from usage logs
     */
    private async getConsumptionFrequency(
        userId: number,
        itemName: string
    ): Promise<number> {
        try {
            // Get consumption data from last 30 days
            const result = await this.sql`
        SELECT COUNT(*) as usage_count
        FROM food_usage_logs
        WHERE user_id = ${userId}
          AND item_name = ${itemName}
          AND usage_date >= CURRENT_DATE - INTERVAL '30 days'
      `;

            const usageCount = parseInt(result[0]?.usage_count || "0");

            // Convert to times per week
            const weeksInPeriod = 30 / 7;
            return usageCount / weeksInPeriod;
        } catch (error) {
            console.error("Error calculating consumption frequency:", error);
            return 0; // Default to 0 if no data
        }
    }

    /**
     * Calculate days until expiration
     */
    private calculateDaysUntilExpiry(expirationDate: string): number {
        const expiry = new Date(expirationDate);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Generate natural language explanation using Gemini AI
     */
    private async generateRiskExplanation(
        item: InventoryItem,
        riskScore: number,
        daysUntilExpiry: number,
        consumptionFreq: number,
        seasonalDescription: string
    ): Promise<string> {
        // Fallback explanation if AI not available
        if (!this.genAI) {
            return this.generateSimpleExplanation(
                item,
                riskScore,
                daysUntilExpiry,
                consumptionFreq
            );
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Generate a brief (1-2 sentences) explanation for why this food item has a ${riskScore}/100 waste risk score:
      
Item: ${item.item_name}
Category: ${item.category}
Quantity: ${item.quantity}
Days until expiry: ${daysUntilExpiry}
Consumption frequency: ${consumptionFreq.toFixed(1)} times per week
Seasonal factor: ${seasonalDescription}

Keep it concise and actionable.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("Error generating AI explanation:", error);
            return this.generateSimpleExplanation(
                item,
                riskScore,
                daysUntilExpiry,
                consumptionFreq
            );
        }
    }

    /**
     * Simple rule-based explanation (fallback)
     */
    private generateSimpleExplanation(
        item: InventoryItem,
        riskScore: number,
        daysUntilExpiry: number,
        consumptionFreq: number
    ): string {
        if (riskScore >= 80) {
            return `High risk: ${item.item_name} expires in ${daysUntilExpiry} days and you consume it only ${consumptionFreq.toFixed(1)}x/week. Consume immediately!`;
        } else if (riskScore >= 50) {
            return `Medium risk: Plan to use ${item.item_name} within ${daysUntilExpiry} days. Current consumption: ${consumptionFreq.toFixed(1)}x/week.`;
        } else {
            return `Low risk: ${item.item_name} has ${daysUntilExpiry} days until expiry and you're consuming it regularly (${consumptionFreq.toFixed(1)}x/week).`;
        }
    }

    /**
     * Calculate risk scores for all user inventory items
     */
    async calculateAllRisks(userId: number): Promise<RiskScore[]> {
        try {
            // Get all user inventory items
            const items = await this.sql`
        SELECT * FROM user_inventory
        WHERE user_id = ${userId}
        ORDER BY expiration_date ASC NULLS LAST
      `;

            const riskScores: RiskScore[] = [];

            for (const item of items) {
                const risk = await this.calculateExpirationRisk(userId, item);
                riskScores.push(risk);
            }

            return riskScores;
        } catch (error) {
            console.error("Error calculating all risks:", error);
            // Log more details if available
            if (error instanceof Error) {
                console.error("Stack:", error.stack);
                if ((error as any).code) {
                    console.error("Postgres Error Code:", (error as any).code);
                }
                if ((error as any).detail) {
                    console.error("Postgres Error Detail:", (error as any).detail);
                }
            }
            throw error;
        }
    }

    /**
     * Save risk scores to database
     */
    async saveRiskScores(userId: number, riskScores: RiskScore[]): Promise<void> {
        try {
            for (const risk of riskScores) {
                await this.sql`
          INSERT INTO expiration_risk_scores (
            user_id,
            inventory_item_id,
            risk_score,
            consumption_frequency,
            category_risk_factor,
            seasonal_factor,
            explanation
          ) VALUES (
            ${userId},
            ${risk.inventory_item_id},
            ${risk.risk_score},
            ${risk.consumption_frequency || 0},
            ${risk.category_risk_factor},
            ${risk.seasonal_factor},
            ${risk.explanation}
          )
          ON CONFLICT (inventory_item_id)
          DO UPDATE SET
            risk_score = EXCLUDED.risk_score,
            consumption_frequency = EXCLUDED.consumption_frequency,
            category_risk_factor = EXCLUDED.category_risk_factor,
            seasonal_factor = EXCLUDED.seasonal_factor,
            explanation = EXCLUDED.explanation,
            calculated_at = NOW()
        `;
            }
        } catch (error) {
            console.error("Error saving risk scores:", error);
            throw error;
        }
    }
}
