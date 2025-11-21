import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function createSustainabilityScores() {
  try {
    console.log("🔄 Creating sustainability scores tables...");

    // Add total_score column to users table
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0
    `;
    console.log("   ✓ Added total_score column to users table");

    // Create user_scores table
    await sql`
      CREATE TABLE IF NOT EXISTS user_scores (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score_date DATE NOT NULL DEFAULT CURRENT_DATE,
        nutrition_points INT DEFAULT 0,
        sustainability_points INT DEFAULT 0,
        budget_points INT DEFAULT 0,
        total_points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, score_date)
      )
    `;
    console.log("   ✓ Created user_scores table");

    // Create user_badges table
    await sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN ('nutri_ninja', 'waste_warrior', 'budget_boss')),
        earned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, badge_type)
      )
    `;
    console.log("   ✓ Created user_badges table");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_scores_date ON user_scores(score_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)`;
    console.log("   ✓ Created indexes");

    console.log("\n✅ Sustainability scores tables created successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

createSustainabilityScores();

