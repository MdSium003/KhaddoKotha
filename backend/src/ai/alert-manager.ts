export interface Alert {
    id?: number;
    user_id: number;
    inventory_item_id: number;
    alert_type: "high_risk" | "expiring_soon" | "consume_now";
    risk_score: number;
    message: string;
    is_dismissed: boolean;
    created_at?: string;
}

/**
 * Alert manager for expiration notifications
 */
export class AlertManager {
    private sql: any;

    constructor(sql: any) {
        this.sql = sql;
    }

    /**
     * Generate alerts for high-risk items (risk score > 70)
     */
    async generateAlerts(userId: number): Promise<Alert[]> {
        try {
            // Get high-risk items
            const highRiskItems = await this.sql`
        SELECT 
          ers.inventory_item_id,
          ers.risk_score,
          ui.item_name,
          ui.category,
          ui.expiration_date,
          ers.explanation
        FROM expiration_risk_scores ers
        JOIN user_inventory ui ON ers.inventory_item_id = ui.id
        WHERE ers.user_id = ${userId}
          AND ers.risk_score > 70
          AND ui.user_id = ${userId}
        ORDER BY ers.risk_score DESC
      `;

            const alerts: Alert[] = [];

            for (const item of highRiskItems) {
                // Check if alert already exists and is not dismissed
                const existingAlert = await this.sql`
          SELECT id FROM expiration_alerts
          WHERE inventory_item_id = ${item.inventory_item_id}
            AND is_dismissed = false
        `;

                if (existingAlert.length > 0) {
                    continue; // Alert already exists
                }

                // Determine alert type
                const alertType = this.determineAlertType(item.risk_score);
                const message = this.generateAlertMessage(item, alertType);

                // Create alert
                const [newAlert] = await this.sql`
          INSERT INTO expiration_alerts (
            user_id,
            inventory_item_id,
            alert_type,
            risk_score,
            message
          ) VALUES (
            ${userId},
            ${item.inventory_item_id},
            ${alertType},
            ${item.risk_score},
            ${message}
          )
          RETURNING *
        `;

                alerts.push({
                    id: newAlert.id,
                    user_id: userId,
                    inventory_item_id: item.inventory_item_id,
                    alert_type: alertType,
                    risk_score: item.risk_score,
                    message,
                    is_dismissed: false,
                    created_at: newAlert.created_at,
                });
            }

            return alerts;
        } catch (error) {
            console.error("Error generating alerts:", error);
            throw error;
        }
    }

    /**
     * Determine alert type based on risk score
     */
    private determineAlertType(
        riskScore: number
    ): "high_risk" | "expiring_soon" | "consume_now" {
        if (riskScore >= 90) return "consume_now";
        if (riskScore >= 80) return "expiring_soon";
        return "high_risk";
    }

    /**
     * Generate alert message
     */
    private generateAlertMessage(item: any, alertType: string): string {
        const itemName = item.item_name;

        switch (alertType) {
            case "consume_now":
                return `⚠️ URGENT: ${itemName} needs to be consumed NOW to avoid waste!`;
            case "expiring_soon":
                return `⏰ ${itemName} is expiring soon. Plan to use it in the next 1-2 days.`;
            case "high_risk":
                return `⚡ ${itemName} has high waste risk. Consider using it soon.`;
            default:
                return `Alert for ${itemName}`;
        }
    }

    /**
     * Get active alerts for a user
     */
    async getActiveAlerts(userId: number): Promise<Alert[]> {
        try {
            const alerts = await this.sql`
        SELECT 
          ea.*,
          ui.item_name,
          ui.category
        FROM expiration_alerts ea
        JOIN user_inventory ui ON ea.inventory_item_id = ui.id
        WHERE ea.user_id = ${userId}
          AND ea.is_dismissed = false
        ORDER BY ea.risk_score DESC, ea.created_at DESC
      `;

            return alerts;
        } catch (error) {
            console.error("Error fetching alerts:", error);
            throw error;
        }
    }

    /**
     * Dismiss an alert
     */
    async dismissAlert(alertId: number, userId: number): Promise<boolean> {
        try {
            const result = await this.sql`
        UPDATE expiration_alerts
        SET is_dismissed = true, dismissed_at = NOW()
        WHERE id = ${alertId} AND user_id = ${userId}
        RETURNING id
      `;

            return result.length > 0;
        } catch (error) {
            console.error("Error dismissing alert:", error);
            throw error;
        }
    }

    /**
     * Dismiss all alerts for a user
     */
    async dismissAllAlerts(userId: number): Promise<number> {
        try {
            const result = await this.sql`
        UPDATE expiration_alerts
        SET is_dismissed = true, dismissed_at = NOW()
        WHERE user_id = ${userId} AND is_dismissed = false
        RETURNING id
      `;

            return result.length;
        } catch (error) {
            console.error("Error dismissing all alerts:", error);
            throw error;
        }
    }

    /**
     * Clean up old dismissed alerts (older than 30 days)
     */
    async cleanupOldAlerts(): Promise<number> {
        try {
            const result = await this.sql`
        DELETE FROM expiration_alerts
        WHERE is_dismissed = true
          AND dismissed_at < NOW() - INTERVAL '30 days'
        RETURNING id
      `;

            return result.length;
        } catch (error) {
            console.error("Error cleaning up old alerts:", error);
            return 0;
        }
    }

    /**
     * Get alert count for a user
     */
    async getAlertCount(userId: number): Promise<number> {
        try {
            const result = await this.sql`
        SELECT COUNT(*) as count
        FROM expiration_alerts
        WHERE user_id = ${userId} AND is_dismissed = false
      `;

            return parseInt(result[0]?.count || "0");
        } catch (error) {
            console.error("Error getting alert count:", error);
            return 0;
        }
    }
}
