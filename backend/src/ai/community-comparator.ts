import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CommunityComparison {
    user_waste_grams_weekly: number;
    user_waste_cost_weekly: number;
    community_avg_grams_weekly: number;
    community_avg_cost_weekly: number;
    percentile: number; // 0-100, higher = better than more users
    comparison_message: string;
    category_comparisons: CategoryComparison[];
}

export interface CategoryComparison {
    category: string;
    user_grams: number;
    community_avg: number;
    performance: "better" | "average" | "worse";
}

export interface AIInsight {
    insight_type: string;
    title: string;
    description: string;
    action_items: string[];
}

/**
 * Community comparator using dummy community data
 */
export class CommunityComparator {
    private sql: any;
    private genAI: GoogleGenerativeAI | null;

    constructor(sql: any, genAI: GoogleGenerativeAI | null) {
        this.sql = sql;
        this.genAI = genAI;
    }

    /**
     * Compare user's waste to community averages
     */
    async compareToCommmunity(
        userId: number,
        userWasteGrams: number,
        userWasteCost: number
    ): Promise<CommunityComparison> {
        try {
            // Get community averages from database
            const communityStats = await this.sql`
        SELECT 
          SUM(avg_waste_grams_weekly) as total_grams,
          SUM(avg_waste_cost_weekly) as total_cost
        FROM community_waste_stats
      `;

            const communityAvgGrams = parseFloat(communityStats[0]?.total_grams || "500");
            const communityAvgCost = parseFloat(communityStats[0]?.total_cost || "10");

            // Calculate percentile (simplified)
            const percentile = this.calculatePercentile(
                userWasteGrams,
                communityAvgGrams
            );

            // Get category-level comparisons
            const categoryComparisons = await this.getCategoryComparisons(userId);

            // Generate comparison message
            const comparisonMessage = this.generateComparisonMessage(
                percentile,
                userWasteGrams,
                communityAvgGrams
            );

            return {
                user_waste_grams_weekly: userWasteGrams,
                user_waste_cost_weekly: userWasteCost,
                community_avg_grams_weekly: communityAvgGrams,
                community_avg_cost_weekly: communityAvgCost,
                percentile,
                comparison_message: comparisonMessage,
                category_comparisons: categoryComparisons,
            };
        } catch (error) {
            console.error("Error comparing to community:", error);
            throw error;
        }
    }

    /**
     * Calculate user's percentile (0-100, higher is better)
     */
    private calculatePercentile(
        userWaste: number,
        communityAvg: number
    ): number {
        if (userWaste <= communityAvg * 0.5) return 90; // Top 10%
        if (userWaste <= communityAvg * 0.75) return 75; // Top 25%
        if (userWaste <= communityAvg) return 50; // Average
        if (userWaste <= communityAvg * 1.25) return 30; // Below average
        return 10; // Bottom 10%
    }

    /**
     * Generate comparison message
     */
    private generateComparisonMessage(
        percentile: number,
        userWaste: number,
        communityAvg: number
    ): string {
        if (percentile >= 75) {
            return `🎉 Excellent! You're wasting ${Math.round(((communityAvg - userWaste) / communityAvg) * 100)}% less than average users. Keep up the great work!`;
        } else if (percentile >= 50) {
            return `👍 Good job! You're performing about average, wasting ${Math.round(userWaste)}g weekly compared to ${Math.round(communityAvg)}g average.`;
        } else if (percentile >= 30) {
            return `⚠️ You're wasting ${Math.round(((userWaste - communityAvg) / communityAvg) * 100)}% more than average. There's room for improvement!`;
        } else {
            return `🚨 Your waste is significantly higher than average (${Math.round(userWaste)}g vs ${Math.round(communityAvg)}g). Let's work on reducing it!`;
        }
    }

    /**
     * Get category-level comparisons
     */
    private async getCategoryComparisons(
        userId: number
    ): Promise<CategoryComparison[]> {
        try {
            // Get user's waste by category (from current estimates)
            const userWaste = await this.sql`
        SELECT 
          ui.category,
          SUM(ui.quantity * ers.risk_score / 100) as estimated_waste
        FROM user_inventory ui
        LEFT JOIN expiration_risk_scores ers ON ui.id = ers.inventory_item_id
        WHERE ui.user_id = ${userId}
        GROUP BY ui.category
      `;

            const comparisons: CategoryComparison[] = [];

            for (const userCat of userWaste) {
                // Get community average for this category
                const [communityCat] = await this.sql`
          SELECT avg_waste_grams_weekly
          FROM community_waste_stats
          WHERE category = ${userCat.category}
        `;

                if (communityCat) {
                    const userGrams = parseFloat(userCat.estimated_waste || "0") * 100; // rough estimate
                    const avgGrams = parseFloat(communityCat.avg_waste_grams_weekly);

                    let performance: "better" | "average" | "worse" = "average";
                    if (userGrams < avgGrams * 0.8) performance = "better";
                    else if (userGrams > avgGrams * 1.2) performance = "worse";

                    comparisons.push({
                        category: userCat.category,
                        user_grams: Math.round(userGrams),
                        community_avg: Math.round(avgGrams),
                        performance,
                    });
                }
            }

            return comparisons;
        } catch (error) {
            console.error("Error getting category comparisons:", error);
            return [];
        }
    }

    /**
     * Generate AI-powered insights for waste reduction
     */
    async generateInsights(
        userId: number,
        comparison: CommunityComparison
    ): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

        // Analyze user's waste patterns
        const wasteRecords = await this.sql`
      SELECT category, reason, COUNT(*) as count
      FROM waste_records
      WHERE user_id = ${userId}
        AND wasted_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY category, reason
      ORDER BY count DESC
      LIMIT 5
    `;

        // Generate AI insights if Gemini is available
        if (this.genAI && wasteRecords.length > 0) {
            try {
                const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

                const prompt = `Based on this user's food waste data, generate 3 concise actionable insights for reducing waste:

User Waste: ${comparison.user_waste_grams_weekly}g/week, $${comparison.user_waste_cost_weekly}/week
Community Average: ${comparison.community_avg_grams_weekly}g/week
Percentile: ${comparison.percentile}th (higher is better)

Recent waste patterns:
${wasteRecords.map((r: any) => `- ${r.category}: ${r.reason} (${r.count} times)`).join("\n")}

For each insight, provide:
1. A short title (max 5 words)
2. A brief description (1-2 sentences)
3. 2-3 specific action items

Format as JSON array: [{"title": "...", "description": "...", "action_items": ["...", "..."]}]`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text().trim();

                // Try to parse JSON response
                try {
                    const parsedInsights = JSON.parse(text);
                    if (Array.isArray(parsedInsights)) {
                        return parsedInsights.map((insight: any) => ({
                            insight_type: "ai_generated",
                            title: insight.title,
                            description: insight.description,
                            action_items: insight.action_items,
                        }));
                    }
                } catch (parseError) {
                    console.error("Error parsing AI insights:", parseError);
                }
            } catch (error) {
                console.error("Error generating AI insights:", error);
            }
        }

        // Fallback to rule-based insights
        return this.generateRuleBasedInsights(comparison, wasteRecords);
    }

    /**
     * Generate rule-based insights (fallback)
     */
    private generateRuleBasedInsights(
        comparison: CommunityComparison,
        wasteRecords: any[]
    ): AIInsight[] {
        const insights: AIInsight[] = [];

        // Insight 1: Overall performance
        if (comparison.percentile < 50) {
            insights.push({
                insight_type: "performance",
                title: "Reduce Overall Waste",
                description: `You're currently wasting more than average. Focus on consuming perishable items first and planning meals better.`,
                action_items: [
                    "Check expiration dates daily",
                    "Use FIFO (First In, First Out) method",
                    "Plan weekly meals in advance",
                ],
            });
        }

        // Insight 2: Category-specific
        const worstCategory = comparison.category_comparisons
            .filter((c) => c.performance === "worse")
            .sort((a, b) => (b.user_grams - b.community_avg) - (a.user_grams - a.community_avg))[0];

        if (worstCategory) {
            insights.push({
                insight_type: "category",
                title: `Reduce ${worstCategory.category} Waste`,
                description: `Your ${worstCategory.category} waste is ${Math.round(((worstCategory.user_grams - worstCategory.community_avg) / worstCategory.community_avg) * 100)}% above average.`,
                action_items: [
                    `Buy smaller quantities of ${worstCategory.category}`,
                    `Learn proper storage techniques for ${worstCategory.category}`,
                    `Consider freezing excess ${worstCategory.category}`,
                ],
            });
        }

        // Insight 3: Waste patterns
        if (wasteRecords.length > 0) {
            const topReason = wasteRecords[0];
            insights.push({
                insight_type: "pattern",
                title: "Address Common Waste Reason",
                description: `Your most common waste reason is "${topReason.reason}" for ${topReason.category} items.`,
                action_items: [
                    "Adjust purchase quantities",
                    "Improve storage conditions",
                    "Set expiration reminders",
                ],
            });
        }

        return insights.slice(0, 3); // Return top 3 insights
    }

    /**
     * Get community averages by category
     */
    async getCommunityAverages(): Promise<any[]> {
        try {
            const stats = await this.sql`
        SELECT * FROM community_waste_stats
        ORDER BY category
      `;
            return stats;
        } catch (error) {
            console.error("Error getting community averages:", error);
            return [];
        }
    }
}
