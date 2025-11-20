import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function createCommunityTables() {
    try {
        console.log("Creating community tables...");

        // Create community_posts table
        await sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('need', 'donate')),
        food_name VARCHAR(100) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        unit VARCHAR(50),
        target_date DATE NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
        console.log("✓ Created community_posts table");

        // Create post_comments table
        await sql`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
        console.log("✓ Created post_comments table");

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id)`;
        console.log("✓ Created indexes");

        console.log("\n✅ Community tables created successfully!");
    } catch (error) {
        console.error("❌ Error creating tables:", error);
        process.exit(1);
    }
}

createCommunityTables();
