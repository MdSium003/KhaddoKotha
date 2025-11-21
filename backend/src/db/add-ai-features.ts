import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
    try {
        console.log("🚀 Starting AI features migration...");

        // Read the SQL file
        const sqlPath = path.join(process.cwd(), "src/db/0001-add-ai-features.sql");
        const sqlContent = fs.readFileSync(sqlPath, "utf-8");

        // Split the content by semicolons to get individual statements
        const statements = sqlContent
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        for (const statement of statements) {
            // Construct a fake TemplateStringsArray to satisfy the driver's check
            // This is necessary because the driver enforces tagged template usage
            const queryParts = [statement];
            Object.assign(queryParts, { raw: [statement] });
            await sql(queryParts as unknown as TemplateStringsArray);
        }

        console.log("✅ AI features migration completed successfully!");
        console.log("Created tables:");
        console.log("  - expiration_risk_scores");
        console.log("  - waste_records");
        console.log("  - waste_estimates");
        console.log("  - expiration_alerts");
        console.log("  - community_waste_stats");

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
