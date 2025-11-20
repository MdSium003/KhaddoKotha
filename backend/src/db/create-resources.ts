import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function createResourcesTable() {
  try {
    console.log("Creating resources table...");

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
    console.log("✓ Created resources table");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type)`;
    console.log("✓ Created indexes");

    // Check if resources already have data
    const existingCount = await sql`
      SELECT COUNT(*) as count FROM resources
    `;
    const count = Number(existingCount[0]?.count || 0);

    if (count === 0) {
      // Seed resources data
      const resources = [
        // 1–10: Waste Reduction
        ['Zero-Waste Kitchen Basics', 'Guide to reducing kitchen waste through simple daily habits.', 'https://example.com/zwk', 'waste_reduction', 'article'],
        ['Composting 101', 'Beginner-friendly introduction to composting food scraps.', 'https://example.com/compost', 'waste_reduction', 'article'],
        ['How to Reduce Food Waste at Home', 'Practical steps to cut food waste by 50%.', 'https://example.com/reducewaste', 'waste_reduction', 'article'],
        ['Zero-Waste Beginner Video', 'Short video explaining how to start a zero-waste lifestyle.', 'https://example.com/zerowastevid', 'waste_reduction', 'video'],
        ['Proper Food Scrap Storage', 'Learn how to store scraps for composting or reuse.', 'https://example.com/scrap-storage', 'waste_reduction', 'guide'],
        ['Leftover Makeover Recipes', 'Ideas for turning leftovers into new meals.', 'https://example.com/leftovers', 'waste_reduction', 'article'],
        ['How to Reuse Vegetable Peels', 'Creative uses for peels to avoid waste.', 'https://example.com/vegpeels', 'waste_reduction', 'guide'],
        ['Food Waste Tracking Template', 'Spreadsheet to track and reduce weekly waste.', 'https://example.com/fwt', 'waste_reduction', 'guide'],
        ['Batch Cooking Guide', 'Cook in batches to reduce waste and save time.', 'https://example.com/batchcook', 'waste_reduction', 'article'],
        ['Understanding Expiry Labels', 'Difference between expiry, best-before, and sell-by dates.', 'https://example.com/expiry', 'waste_reduction', 'article'],

        // 11–20: Nutrition
        ['Basics of Balanced Nutrition', 'Overview of macro- and micronutrients.', 'https://example.com/balanced', 'nutrition', 'article'],
        ['Healthy Plate Model', 'Visual breakdown of a balanced meal.', 'https://example.com/plate', 'nutrition', 'guide'],
        ['High-Protein Vegetarian Meals', 'List of affordable high-protein dishes.', 'https://example.com/proteinveg', 'nutrition', 'article'],
        ['Nutrition for Students', 'Cheap and simple nutrition tips for learners.', 'https://example.com/students', 'nutrition', 'guide'],
        ['Hydration Tips', 'How much water you should drink daily.', 'https://example.com/water', 'nutrition', 'article'],
        ['Deficiencies Explained', 'Symptoms and prevention of common nutrient deficiencies.', 'https://example.com/deficiency', 'nutrition', 'article'],
        ['Fiber-Rich Foods List', 'Foods that promote digestion.', 'https://example.com/fiber', 'nutrition', 'guide'],
        ['Meal Balanced Video Guide', 'Short video explaining balanced meal breakdown.', 'https://example.com/nutritionvid', 'nutrition', 'video'],
        ['Low-Budget Healthy Foods', '21 cheap nutritious foods anyone can buy.', 'https://example.com/budgetfoods', 'nutrition', 'article'],
        ['Quick Healthy Snacks', 'List of 5-minute nutritious snacks.', 'https://example.com/quick-snacks', 'nutrition', 'guide'],

        // 21–30: Meal Planning
        ['Weekly Meal Planning Template', 'Ready-made layout for planning meals.', 'https://example.com/template', 'meal_planning', 'guide'],
        ['Meal Prep for Beginners', 'Steps to prepare meals for the full week.', 'https://example.com/mealprep', 'meal_planning', 'article'],
        ['Healthy Meal Prep Video', 'Visual walkthrough of a 5-day meal plan.', 'https://example.com/mealvid', 'meal_planning', 'video'],
        ['How to Choose 10 Core Ingredients', 'Plan meals around versatile ingredients.', 'https://example.com/core', 'meal_planning', 'guide'],
        ['Budget-Friendly Meal Plan', 'Weekly plan costing under $20.', 'https://example.com/budgetplan', 'meal_planning', 'article'],
        ['Vegetarian Meal Planning', 'Plant-based meal plan for beginners.', 'https://example.com/vegplan', 'meal_planning', 'guide'],
        ['Macro-Friendly Meal Plan', 'Meal planning for fitness goals.', 'https://example.com/macro', 'meal_planning', 'article'],
        ['Batch Cooking Meal Plan', 'Five recipes designed for batch cooking.', 'https://example.com/batchplan', 'meal_planning', 'guide'],
        ['30-Minute Meal Plan', 'Plan built around fast and simple recipes.', 'https://example.com/30min', 'meal_planning', 'article'],
        ['Meal Planning Mistakes to Avoid', 'Top pitfalls and how to fix them.', 'https://example.com/mistakes', 'meal_planning', 'article'],

        // 31–40: Storage Tips
        ['Food Storage Basics', 'Where to store common foods.', 'https://example.com/storage', 'storage_tips', 'guide'],
        ['Fridge Organization 101', 'How to properly organize the refrigerator.', 'https://example.com/fridge', 'storage_tips', 'article'],
        ['Freeze Like a Pro', 'How to freeze foods without losing quality.', 'https://example.com/freezing', 'storage_tips', 'guide'],
        ['Vegetable Storage Chart', 'Chart of how long veggies last in fridge/pantry.', 'https://example.com/vegchart', 'storage_tips', 'guide'],
        ['How to Store Cooked Rice Safely', 'Prevent bacterial growth in cooked rice.', 'https://example.com/rice', 'storage_tips', 'article'],
        ['Shelf-Life Guide', 'Shelf life of common pantry items.', 'https://example.com/shelflife', 'storage_tips', 'article'],
        ['Airtight Containers Guide', 'Choosing proper containers for storage.', 'https://example.com/containers', 'storage_tips', 'guide'],
        ['How to Avoid Freezer Burn', 'Techniques to store frozen food correctly.', 'https://example.com/freezerburn', 'storage_tips', 'article'],
        ['Leftover Storage Rules', 'How long leftovers last + safety rules.', 'https://example.com/leftoverstorage', 'storage_tips', 'guide'],
        ['Proper Meat Storage', 'Temperature and packaging rules.', 'https://example.com/meat', 'storage_tips', 'article'],

        // 41–50: Budget & Savings
        ['Smart Grocery Shopping', 'How to shop cheap but healthy.', 'https://example.com/smartshop', 'budget', 'guide'],
        ['10 Cheapest High-Nutrition Foods', 'Maximize nutrition on a budget.', 'https://example.com/cheapnutri', 'budget', 'article'],
        ['Monthly Grocery Budget Planner', 'Simple worksheet for planning.', 'https://example.com/budgetsheet', 'budget', 'guide'],
        ['Cooking on a Tight Budget', 'Meals that cost less than $1.', 'https://example.com/1dollar', 'budget', 'article'],
        ['Batch Cooking to Save Money', 'Save 30% with batch meals.', 'https://example.com/batchsave', 'budget', 'article'],
        ['How to Stop Impulse Buying', 'Behavioral tips that save money.', 'https://example.com/impulse', 'budget', 'guide'],
        ['Affordable Protein Sources', 'Cheap alternatives to meat.', 'https://example.com/cheapprotein', 'budget', 'article'],
        ['Price Comparison Chart', 'Compare prices of common staples.', 'https://example.com/pricechart', 'budget', 'guide'],
        ['Coupons & Discounts Guide', 'How to use discounts effectively.', 'https://example.com/coupons', 'budget', 'guide'],
        ['Storing Food to Save Money', 'Prevent spoilage and waste to cut costs.', 'https://example.com/storesavemoney', 'budget', 'article'],
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
      console.log(`   ✓ Resources table already has ${count} items`);
    }

    console.log("\n✅ Resources table created successfully!");
  } catch (error) {
    console.error("❌ Error creating resources table:", error);
    process.exit(1);
  }
}

createResourcesTable();

