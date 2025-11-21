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
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("   ✓ Created 'food_usage_logs' table");

    // Add image_url column if it doesn't exist (for existing databases)
    try {
      await sql`ALTER TABLE food_usage_logs ADD COLUMN IF NOT EXISTS image_url TEXT`;
      console.log("   ✓ Added image_url column to food_usage_logs");
    } catch (err) {
      // Column might already exist, ignore
    }

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
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("   ✓ Created 'user_inventory' table");

    // Add image_url column if it doesn't exist (for existing databases)
    try {
      await sql`ALTER TABLE user_inventory ADD COLUMN IF NOT EXISTS image_url TEXT`;
      console.log("   ✓ Added image_url column to user_inventory");
    } catch (err) {
      // Column might already exist, ignore
    }

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id)
    `;
    console.log("   ✓ Created index on user_id");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_inventory_expiration_date ON user_inventory(expiration_date)
    `;
    console.log("   ✓ Created index on expiration_date");

    // Create resources table
    await sql`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("   ✓ Created 'resources' table");

    // Create indexes for resources
    await sql`
      CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category)
    `;
    console.log("   ✓ Created index on resources.category");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type)
    `;
    console.log("   ✓ Created index on resources.type");

    // Check if resources already have data
    const resourcesCount = await sql`
      SELECT COUNT(*) as count FROM resources
    `;
    const resourcesExisting = Number(resourcesCount[0]?.count || 0);

    if (resourcesExisting === 0) {
      // Seed resources data
      const resources = [
        // 1–10: Waste Reduction
        ['Reduce Waste with Portion Planning', 'Learn how measuring portions prevents leftovers from being thrown out.', 'https://example.com/portion-planning', 'waste_reduction', 'article'],
        ['Composting Guide for Beginners', 'Step-by-step instructions for composting vegetable scraps and eggshells.', 'https://example.com/compost-basics', 'waste_reduction', 'guide'],
        ['How to Use Expiring Foods', 'Tips for using near-expiry vegetables, dairy, and bread before they spoil.', 'https://example.com/expiring-food', 'waste_reduction', 'article'],
        ['Zero-Waste Cooking Video', 'Video showing how to cook full meals using commonly wasted ingredients.', 'https://example.com/zw-cooking', 'waste_reduction', 'video'],
        ['Storing Scraps for Broth', 'Turn vegetable scraps like peels and stems into homemade broth.', 'https://example.com/scrap-broth', 'waste_reduction', 'guide'],
        ['Leftover Upgrade Recipes', 'Simple recipes that convert leftovers into fresh new dishes.', 'https://example.com/leftover-recipes', 'waste_reduction', 'article'],
        ['Reduce Fruit Waste', 'Learn how to store apples, bananas, citrus, and berries for maximum shelf life.', 'https://example.com/fruit-waste', 'waste_reduction', 'guide'],
        ['Weekly Waste Tracking Sheet', 'A downloadable sheet to track wasted food and identify patterns.', 'https://example.com/waste-sheet', 'waste_reduction', 'guide'],
        ['Batch Cooking to Reduce Waste', 'Plan meals in bulk to avoid repeated spoilage of ingredients.', 'https://example.com/batch-waste', 'waste_reduction', 'article'],
        ['Understanding Expiry vs Best-Before', 'Know the difference so you stop throwing away safe food.', 'https://example.com/expiry-guide', 'waste_reduction', 'article'],

        // 11–20: Nutrition
        ['Nutrient Breakdown of Common Foods', 'Macros and micros for grains, vegetables, dairy, and proteins.', 'https://example.com/nutrient-breakdown', 'nutrition', 'article'],
        ['Balanced Plate Guide', 'Visual guide showing ideal portions of vegetables, grains, and protein.', 'https://example.com/balanced-plate', 'nutrition', 'guide'],
        ['Protein Sources for Vegetarians', 'Affordable vegetarian protein options such as lentils, eggs, tofu.', 'https://example.com/veg-protein', 'nutrition', 'article'],
        ['Nutrition Tips for Students', 'Low-cost and high-nutrition meals for students living alone.', 'https://example.com/student-nutrition', 'nutrition', 'guide'],
        ['Daily Hydration Recommendations', 'How much water you need based on climate and activity.', 'https://example.com/hydration', 'nutrition', 'article'],
        ['Micronutrient Deficiency Warnings', 'Signs of vitamin and mineral deficiencies and foods to fix them.', 'https://example.com/micro-def', 'nutrition', 'article'],
        ['High-Fiber Food List', 'Vegetables, fruits, and grains that improve digestion.', 'https://example.com/fiber-list', 'nutrition', 'guide'],
        ['Balanced Meals Video Tutorial', 'Short video explaining how to build a balanced, nutritious plate.', 'https://example.com/balanced-meal-video', 'nutrition', 'video'],
        ['Cheap Nutritious Food List', 'Top 20 foods that are both affordable and nutrient-dense.', 'https://example.com/cheap-nutrition', 'nutrition', 'article'],
        ['5-Minute Healthy Snacks', 'Quick snacks under 200 calories using common household items.', 'https://example.com/quick-snacks', 'nutrition', 'guide'],

        // 21–30: Meal Planning
        ['Weekly Meal Plan Template', 'Downloadable template for weekly breakfast, lunch, and dinner planning.', 'https://example.com/mp-template', 'meal_planning', 'guide'],
        ['Beginner Meal Prep Basics', 'Learn to plan and cook meals for 3–5 days at once.', 'https://example.com/meal-prep', 'meal_planning', 'article'],
        ['Meal Prep Video Walkthrough', 'Visual explanation of prepping a week’s meals in 2 hours.', 'https://example.com/mp-video', 'meal_planning', 'video'],
        ['Core Ingredient Strategy', 'Choose 8–10 versatile ingredients and build multiple meals.', 'https://example.com/core-ingredients', 'meal_planning', 'guide'],
        ['Under-1000 TK Weekly Plan', 'A full one-week meal plan designed for small budgets.', 'https://example.com/budget-mealplan', 'meal_planning', 'article'],
        ['Vegetarian Weekly Plan', 'Structured weekly meal plan for plant-based diets.', 'https://example.com/veg-weekly', 'meal_planning', 'guide'],
        ['Fitness-Oriented Meal Plan', 'Meal plan focusing on high-protein, macro-friendly dishes.', 'https://example.com/fitness-weekly', 'meal_planning', 'article'],
        ['Batch Cooking Recipes', '5 recipes designed to be cooked in large batches.', 'https://example.com/batch-recipes', 'meal_planning', 'guide'],
        ['Quick 30-Minute Plan', 'A weekly plan built around recipes that take under 30 minutes.', 'https://example.com/30min-plan', 'meal_planning', 'article'],
        ['Meal Planning Mistakes', 'Common planning mistakes and how to avoid them.', 'https://example.com/mp-mistakes', 'meal_planning', 'article'],

        // 31–40: Storage Tips
        ['Food Storage for Beginners', 'Where to store vegetables, grains, dairy, and frozen foods.', 'https://example.com/storage-basics', 'storage_tips', 'guide'],
        ['Fridge Organization Tips', 'Improve shelf life by placing foods in the right fridge zones.', 'https://example.com/fridge-org', 'storage_tips', 'article'],
        ['Freezing Vegetables Properly', 'How to freeze spinach, peas, carrots, and beans for long-term use.', 'https://example.com/freeze-veggies', 'storage_tips', 'guide'],
        ['Vegetable Storage Chart', 'How long leafy greens, roots, and herbs last in pantry/fridge.', 'https://example.com/veg-chart', 'storage_tips', 'guide'],
        ['Safe Rice Storage', 'Prevent bacterial growth in cooked rice and raw rice.', 'https://example.com/rice-storage', 'storage_tips', 'article'],
        ['Pantry Item Shelf-Life Guide', 'Shelf life of common grains, lentils, and packaged goods.', 'https://example.com/pantry-shelf', 'storage_tips', 'article'],
        ['Choosing Airtight Containers', 'Why airtight containers keep food fresh longer.', 'https://example.com/airtight-guide', 'storage_tips', 'guide'],
        ['Preventing Freezer Burn', 'How to wrap and store food to avoid freezer burn.', 'https://example.com/freezerburn', 'storage_tips', 'article'],
        ['Leftover Safety Rules', 'How long leftovers last and proper reheating rules.', 'https://example.com/leftover-safety', 'storage_tips', 'guide'],
        ['Safe Meat Storage', 'Temperature and packing guidelines for raw and cooked meat.', 'https://example.com/meat-storage', 'storage_tips', 'article'],

        // 41–50: Budget & Savings
        ['Smart Grocery Strategy', 'List-first strategy to avoid overspending and impulse buying.', 'https://example.com/smart-grocery', 'budget', 'guide'],
        ['Cheapest High-Nutrition Foods', '10 budget foods with high nutrient density.', 'https://example.com/cheap-nutrition', 'budget', 'article'],
        ['Monthly Budget Planner Template', 'Worksheet to track expenses and monthly food budgets.', 'https://example.com/budget-template', 'budget', 'guide'],
        ['Meals Under 50 Taka', 'Affordable meals that cost less than 50 TK to prepare.', 'https://example.com/cheap-meals', 'budget', 'article'],
        ['Batch Cooking for Savings', 'Save up to 25% on groceries through batch cooking.', 'https://example.com/batch-savings', 'budget', 'article'],
        ['Stop Impulse Buying', 'Behavior tricks to reduce impulse grocery purchases.', 'https://example.com/stop-impulse', 'budget', 'guide'],
        ['Affordable Protein Sources', 'Low-cost protein alternatives such as eggs, lentils, and chickpeas.', 'https://example.com/affordable-protein', 'budget', 'article'],
        ['Price Comparison Guide', 'Compare prices of common staples like rice, eggs, sugar.', 'https://example.com/price-compare', 'budget', 'guide'],
        ['Coupon & Discount Tips', 'Maximize savings by using discounts effectively.', 'https://example.com/coupon-tips', 'budget', 'guide'],
        ['Prevent Spoilage to Save Money', 'Learn how proper storage prevents spoilage and reduces grocery costs.', 'https://example.com/spoilage-savings', 'budget', 'article'],
      ];

      for (const [title, description, url, category, type] of resources) {
        try {
          await sql`
            INSERT INTO resources (title, description, url, category, type)
            VALUES (${title}, ${description}, ${url}, ${category}, ${type})
          `;
        } catch (err) {
          console.warn(`   ⚠ Skipped duplicate resource: ${title}`);
        }
      }
      console.log("   ✓ Seeded 50 resources");
    } else {
      console.log(`   ✓ Resources table already has ${resourcesExisting} items`);
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();

