import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.error("Please set it in your .env file");
    process.exit(1);
  }

  try {
    console.log("🔄 Connecting to database...");
    const sql = neon(databaseUrl);

    console.log("📝 Running migration...");

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        google_id VARCHAR(255) UNIQUE,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("   ✓ Created 'users' table");

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;
    console.log("   ✓ Created index on email");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
    `;
    console.log("   ✓ Created index on google_id");

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();

