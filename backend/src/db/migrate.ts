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
        budget_preferences VARCHAR(50),
        dietary_needs TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("   ✓ Created 'users' table");

    // Add new columns if they don't exist (for existing databases)
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_preferences VARCHAR(50)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_needs TEXT`;
      console.log("   ✓ Added profile preference columns");
    } catch (err) {
      // Columns might already exist, ignore
    }

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;
    console.log("   ✓ Created index on email");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
    `;
    console.log("   ✓ Created index on google_id");

    // Create food_inventory table
    await sql`
      CREATE TABLE IF NOT EXISTS food_inventory (
        id SERIAL PRIMARY KEY,
        item_name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        expiration_days INT NOT NULL,
        cost_per_unit NUMERIC(6,2) NOT NULL
      )
    `;
    console.log("   ✓ Created 'food_inventory' table");

    // Check if inventory already has data
    const existingCount = await sql`
      SELECT COUNT(*) as count FROM food_inventory
    `;
    const count = Number(existingCount[0]?.count || 0);

    if (count === 0) {
      // Seed food inventory data
      const foodItems = [
        ['Apple', 'Fruit', 30, 0.50],
        ['Banana', 'Fruit', 7, 0.30],
        ['Orange', 'Fruit', 20, 0.60],
        ['Milk', 'Dairy', 7, 1.20],
        ['Cheese', 'Dairy', 30, 2.50],
        ['Yogurt', 'Dairy', 10, 0.90],
        ['Bread', 'Grain', 5, 1.00],
        ['Rice', 'Grain', 365, 0.80],
        ['Pasta', 'Grain', 365, 1.50],
        ['Eggs', 'Protein', 14, 0.20],
        ['Chicken Breast', 'Protein', 3, 4.50],
        ['Salmon', 'Protein', 2, 6.00],
        ['Almonds', 'Nuts', 180, 0.10],
        ['Peanut Butter', 'Spread', 180, 1.50],
        ['Tomato', 'Vegetable', 7, 0.40],
        ['Carrot', 'Vegetable', 14, 0.25],
        ['Potato', 'Vegetable', 30, 0.15],
        ['Onion', 'Vegetable', 60, 0.20],
        ['Spinach', 'Vegetable', 5, 0.35],
        ['Butter', 'Dairy', 90, 2.00],
        ['Oats', 'Grain', 180, 0.60],
        ['Cucumber', 'Vegetable', 7, 0.30],
        ['Strawberry', 'Fruit', 5, 0.70],
        ['Blueberry', 'Fruit', 7, 0.80],
        ['Beef', 'Protein', 5, 5.00],
        ['Pork', 'Protein', 4, 4.00],
        ['Lettuce', 'Vegetable', 5, 0.50],
        ['Cabbage', 'Vegetable', 20, 0.45],
        ['Mango', 'Fruit', 10, 1.00],
        ['Pineapple', 'Fruit', 10, 1.50],
        ['Cereal', 'Grain', 365, 3.00],
        ['Flour', 'Grain', 365, 1.20],
        ['Sugar', 'Grain', 730, 0.50],
        ['Salt', 'Grain', 1825, 0.20],
        ['Honey', 'Spread', 730, 3.50],
        ['Jam', 'Spread', 180, 2.00],
        ['Coffee', 'Beverage', 365, 4.00],
        ['Tea', 'Beverage', 365, 2.50],
        ['Orange Juice', 'Beverage', 10, 2.00],
        ['Apple Juice', 'Beverage', 10, 2.20],
        ['Yogurt Drink', 'Beverage', 7, 1.50],
        ['Cheddar Cheese', 'Dairy', 60, 3.00],
        ['Mozzarella', 'Dairy', 30, 2.80],
        ['Bagel', 'Grain', 7, 1.20],
        ['Tortilla', 'Grain', 30, 1.50],
        ['Walnuts', 'Nuts', 180, 0.15],
        ['Cashews', 'Nuts', 180, 0.20],
        ['Lentils', 'Protein', 365, 1.00],
        ['Chickpeas', 'Protein', 365, 1.10],
        ['Coconut', 'Fruit', 30, 1.50],
        ['Avocado', 'Fruit', 7, 1.20],
        ['Grapes', 'Fruit', 7, 0.80],
        ['Kiwi', 'Fruit', 10, 0.90],
      ];

      for (const [itemName, category, expirationDays, costPerUnit] of foodItems) {
        try {
          await sql`
            INSERT INTO food_inventory (item_name, category, expiration_days, cost_per_unit)
            VALUES (${itemName}, ${category}, ${expirationDays}, ${costPerUnit})
          `;
        } catch (err) {
          // Ignore duplicate errors
          console.warn(`   ⚠ Skipped duplicate item: ${itemName}`);
        }
      }
      console.log("   ✓ Seeded food inventory data");
    } else {
      console.log(`   ✓ Food inventory already has ${count} items`);
    }

    // Create food_usage_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS food_usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_name VARCHAR(100) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("   ✓ Created 'food_usage_logs' table");

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_food_usage_logs_user_id ON food_usage_logs(user_id)
    `;
    console.log("   ✓ Created index on user_id");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_food_usage_logs_usage_date ON food_usage_logs(usage_date)
    `;
    console.log("   ✓ Created index on usage_date");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_food_usage_logs_user_date ON food_usage_logs(user_id, usage_date)
    `;
    console.log("   ✓ Created composite index on user_id and usage_date");

    // Create user_inventory table
    await sql`
      CREATE TABLE IF NOT EXISTS user_inventory (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_name VARCHAR(100) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        purchase_date DATE,
        expiration_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("   ✓ Created 'user_inventory' table");

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id)
    `;
    console.log("   ✓ Created index on user_id");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_inventory_expiration_date ON user_inventory(expiration_date)
    `;
    console.log("   ✓ Created index on expiration_date");

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();

