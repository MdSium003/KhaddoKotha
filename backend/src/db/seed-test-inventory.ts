import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function seedTestData() {
    try {
        console.log("🌱 Seeding test inventory data...");

        // Get the first user (or you can specify a user ID)
        const users = await sql`SELECT id FROM users LIMIT 1`;

        if (users.length === 0) {
            console.error("❌ No users found. Please create a user account first.");
            process.exit(1);
        }

        const userId = users[0].id;
        console.log(`👤 Using user ID: ${userId}`);

        // Clear existing test data for this user
        await sql`DELETE FROM user_inventory WHERE user_id = ${userId}`;
        console.log("🧹 Cleared existing inventory");

        // Add test inventory items with various expiration dates
        const today = new Date();

        const testItems = [
            // Items expiring soon (high risk)
            {
                itemName: "Milk",
                quantity: 2,
                category: "Dairy",
                purchaseDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                itemName: "Strawberries",
                quantity: 1,
                category: "Fruits",
                purchaseDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                itemName: "Lettuce",
                quantity: 1,
                category: "Vegetables",
                purchaseDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            // Items with medium expiration (medium risk)
            {
                itemName: "Chicken Breast",
                quantity: 1.5,
                category: "Meat",
                purchaseDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                itemName: "Yogurt",
                quantity: 3,
                category: "Dairy",
                purchaseDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                itemName: "Tomatoes",
                quantity: 5,
                category: "Vegetables",
                purchaseDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            // Items with longer shelf life (low risk)
            {
                itemName: "Rice",
                quantity: 2,
                category: "Grains",
                purchaseDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                itemName: "Canned Beans",
                quantity: 4,
                category: "Grains",
                purchaseDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                itemName: "Apples",
                quantity: 6,
                category: "Fruits",
                purchaseDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                itemName: "Cheese",
                quantity: 1,
                category: "Dairy",
                purchaseDate: today.toISOString().split('T')[0],
                expirationDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
        ];

        for (const item of testItems) {
            await sql`
        INSERT INTO user_inventory (user_id, item_name, quantity, category, purchase_date, expiration_date)
        VALUES (${userId}, ${item.itemName}, ${item.quantity}, ${item.category}, ${item.purchaseDate}, ${item.expirationDate})
      `;
        }

        console.log(`✅ Added ${testItems.length} test inventory items`);

        // Add some food usage logs for consumption frequency analysis
        console.log("📊 Adding food usage logs...");

        const usageLogs = [
            { itemName: "Milk", quantity: 0.5, category: "Dairy", daysAgo: 1 },
            { itemName: "Milk", quantity: 0.3, category: "Dairy", daysAgo: 3 },
            { itemName: "Rice", quantity: 0.5, category: "Grains", daysAgo: 2 },
            { itemName: "Chicken Breast", quantity: 0.5, category: "Meat", daysAgo: 4 },
            { itemName: "Apples", quantity: 2, category: "Fruits", daysAgo: 1 },
            { itemName: "Apples", quantity: 1, category: "Fruits", daysAgo: 3 },
        ];

        for (const log of usageLogs) {
            const usageDate = new Date(today.getTime() - log.daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            await sql`
        INSERT INTO food_usage_logs (user_id, item_name, quantity, category, usage_date)
        VALUES (${userId}, ${log.itemName}, ${log.quantity}, ${log.category}, ${usageDate})
      `;
        }

        console.log(`✅ Added ${usageLogs.length} usage logs`);

        // Add some waste records for historical analysis
        console.log("🗑️ Adding historical waste records...");
        const wasteRecords = [
            { itemName: "Spinach", category: "Vegetables", quantity: 200, cost: 3.50, reason: "expired", daysAgo: 10 },
            { itemName: "Bread", category: "Grains", quantity: 300, cost: 2.00, reason: "moldy", daysAgo: 5 },
            { itemName: "Milk", category: "Dairy", quantity: 500, cost: 1.50, reason: "sour", daysAgo: 2 },
            { itemName: "Banana", category: "Fruits", quantity: 150, cost: 0.80, reason: "rotten", daysAgo: 15 },
        ];

        for (const record of wasteRecords) {
            const wastedDate = new Date(today.getTime() - record.daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            await sql`
                INSERT INTO waste_records (user_id, item_name, category, quantity_grams, cost_wasted, reason, wasted_date)
                VALUES (${userId}, ${record.itemName}, ${record.category}, ${record.quantity}, ${record.cost}, ${record.reason}, ${wastedDate})
            `;
        }
        console.log(`✅ Added ${wasteRecords.length} waste records`);

        console.log("\n🎉 Test data seeded successfully!");
        console.log("\n📋 Summary:");
        console.log(`   • ${testItems.length} inventory items added`);
        console.log(`   • ${usageLogs.length} usage logs added`);
        console.log("\n💡 Next steps:");
        console.log("   1. Go to /analytics page");
        console.log("   2. Click 'Recalculate Risks' button");
        console.log("   3. See your AI-powered analytics!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedTestData();
