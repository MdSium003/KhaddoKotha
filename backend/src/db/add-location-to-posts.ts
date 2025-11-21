import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function addLocationToPosts() {
  try {
    console.log("🔄 Adding location fields to community_posts table...");

    // Add location columns
    await sql`
      ALTER TABLE community_posts 
      ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
      ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
      ADD COLUMN IF NOT EXISTS address TEXT
    `;
    console.log("   ✓ Added latitude, longitude, and address columns");

    // Add index for location-based queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_community_posts_location ON community_posts(latitude, longitude)
    `;
    console.log("   ✓ Created location index");

    console.log("\n✅ Location fields added successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addLocationToPosts();

