import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runFix() {
    try {
        console.log("🔧 Running database constraint fix...");

        // First ensure there are no duplicates
        // We need to do this because we can't use DO blocks easily with the tagged template literal in some versions
        // So we'll run raw queries one by one

        console.log("  - Cleaning up duplicates...");
        await sql`
      DELETE FROM expiration_risk_scores a USING expiration_risk_scores b
      WHERE a.id < b.id AND a.inventory_item_id = b.inventory_item_id
    `;

        console.log("  - Dropping existing constraint if any...");
        await sql`
      ALTER TABLE expiration_risk_scores DROP CONSTRAINT IF EXISTS expiration_risk_scores_inventory_item_id_key
    `;

        console.log("  - Adding unique constraint...");
        await sql`
      ALTER TABLE expiration_risk_scores ADD CONSTRAINT expiration_risk_scores_inventory_item_id_key UNIQUE (inventory_item_id)
    `;

        console.log("✅ Database constraint fixed successfully!");
    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    }
}

runFix();
