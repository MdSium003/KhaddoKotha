import { RiskScore } from "./risk-predictor";

export interface PrioritizedItem {
    inventory_item_id: number;
    item_name: string;
    category: string;
    quantity: number;
    expiration_date?: string;
    priority_score: number;
    priority_rank: number;
    risk_score: number;
    days_until_expiry?: number | undefined;
    recommendation: string;
}

/**
 * Ranking service that combines FIFO with AI risk scores
 */
export class RankingService {
    private sql: any;

    constructor(sql: any) {
        this.sql = sql;
    }

    /**
     * Prioritize items for consumption using FIFO + AI hybrid approach
     * Priority score = (FIFO score * 0.4) + (AI risk score * 0.6)
     */
    async prioritizeItems(userId: number): Promise<PrioritizedItem[]> {
        try {
            // Get all inventory items with their risk scores
            const items = await this.sql`
        SELECT 
          ui.id as inventory_item_id,
          ui.item_name,
          ui.category,
          ui.quantity,
          ui.expiration_date,
          COALESCE(ers.risk_score, 50) as risk_score,
          ers.explanation
        FROM user_inventory ui
        LEFT JOIN expiration_risk_scores ers ON ui.id = ers.inventory_item_id
        WHERE ui.user_id = ${userId}
        ORDER BY ui.expiration_date ASC NULLS LAST
      `;

            const prioritizedItems: PrioritizedItem[] = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                // Calculate FIFO score (based on expiration date)
                const fifoScore = this.calculateFIFOScore(item, i, items.length);

                // Combine FIFO with AI risk score
                let priorityScore = fifoScore * 0.4 + item.risk_score * 0.6;

                // CRITICAL FIX: If item is expired, priority must be 100
                const daysUntilExpiry = item.expiration_date
                    ? this.calculateDaysUntilExpiry(item.expiration_date)
                    : 100;

                if (daysUntilExpiry <= 0) {
                    priorityScore = 100;
                }

                // Generate recommendation
                const recommendation = this.generateRecommendation(
                    item,
                    priorityScore,
                    item.risk_score
                );

                prioritizedItems.push({
                    inventory_item_id: item.inventory_item_id,
                    item_name: item.item_name,
                    category: item.category,
                    quantity: item.quantity,
                    expiration_date: item.expiration_date,
                    priority_score: Math.round(priorityScore),
                    priority_rank: 0, // Will be set after sorting
                    risk_score: item.risk_score,
                    days_until_expiry: item.expiration_date
                        ? this.calculateDaysUntilExpiry(item.expiration_date)
                        : undefined,
                    recommendation,
                });
            }

            // Sort by priority score (highest first)
            prioritizedItems.sort((a, b) => b.priority_score - a.priority_score);

            // Assign ranks
            prioritizedItems.forEach((item, index) => {
                item.priority_rank = index + 1;
            });

            // Save priority ranks to database
            await this.savePriorityRanks(prioritizedItems);

            return prioritizedItems;
        } catch (error) {
            console.error("Error prioritizing items:", error);
            throw error;
        }
    }

    /**
     * Calculate FIFO score based on expiration date position
     */
    private calculateFIFOScore(
        item: any,
        index: number,
        totalItems: number
    ): number {
        if (!item.expiration_date) {
            return 30; // Default low priority for items without expiry dates
        }

        const daysUntilExpiry = this.calculateDaysUntilExpiry(item.expiration_date);

        // Items expiring soon get higher scores
        if (daysUntilExpiry <= 0) return 100; // Already expired
        if (daysUntilExpiry <= 2) return 95;
        if (daysUntilExpiry <= 5) return 85;
        if (daysUntilExpiry <= 7) return 70;
        if (daysUntilExpiry <= 14) return 50;

        return 30;
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
     * Generate consumption recommendation
     */
    private generateRecommendation(
        item: any,
        priorityScore: number,
        riskScore: number
    ): string {
        const daysUntilExpiry = item.expiration_date
            ? this.calculateDaysUntilExpiry(item.expiration_date)
            : 100;

        if (daysUntilExpiry <= 0) {
            return `⛔ EXPIRED: Don't eat it, rather make it asset.`;
        }

        if (priorityScore >= 80) {
            return `🔴 URGENT: Consume ${item.item_name} immediately to avoid waste!`;
        } else if (priorityScore >= 60) {
            return `🟡 HIGH PRIORITY: Plan to use ${item.item_name} in the next 2-3 days.`;
        } else if (priorityScore >= 40) {
            return `🟢 MEDIUM: Include ${item.item_name} in your meal planning this week.`;
        } else {
            return `⚪ LOW: ${item.item_name} is stable, use when convenient.`;
        }
    }

    /**
     * Save priority ranks to database
     */
    private async savePriorityRanks(
        items: PrioritizedItem[]
    ): Promise<void> {
        try {
            for (const item of items) {
                await this.sql`
          UPDATE expiration_risk_scores
          SET priority_rank = ${item.priority_rank}
          WHERE inventory_item_id = ${item.inventory_item_id}
        `;
            }
        } catch (error) {
            console.error("Error saving priority ranks:", error);
            // Non-critical, don't throw
        }
    }

    /**
     * Get top N priority items
     */
    async getTopPriorityItems(
        userId: number,
        limit: number = 10
    ): Promise<PrioritizedItem[]> {
        const allItems = await this.prioritizeItems(userId);
        return allItems.slice(0, limit);
    }
}
