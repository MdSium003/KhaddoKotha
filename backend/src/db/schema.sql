-- Users table for authentication
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
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Food inventory table
CREATE TABLE IF NOT EXISTS food_inventory (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  expiration_days INT NOT NULL,
  cost_per_unit NUMERIC(6,2) NOT NULL
);

-- Seed food inventory data
INSERT INTO food_inventory (item_name, category, expiration_days, cost_per_unit) VALUES
('Apple', 'Fruit', 30, 0.50),
('Banana', 'Fruit', 7, 0.30),
('Orange', 'Fruit', 20, 0.60),
('Milk', 'Dairy', 7, 1.20),
('Cheese', 'Dairy', 30, 2.50),
('Yogurt', 'Dairy', 10, 0.90),
('Bread', 'Grain', 5, 1.00),
('Rice', 'Grain', 365, 0.80),
('Pasta', 'Grain', 365, 1.50),
('Eggs', 'Protein', 14, 0.20),
('Chicken Breast', 'Protein', 3, 4.50),
('Salmon', 'Protein', 2, 6.00),
('Almonds', 'Nuts', 180, 0.10),
('Peanut Butter', 'Spread', 180, 1.50),
('Tomato', 'Vegetable', 7, 0.40),
('Carrot', 'Vegetable', 14, 0.25),
('Potato', 'Vegetable', 30, 0.15),
('Onion', 'Vegetable', 60, 0.20),
('Spinach', 'Vegetable', 5, 0.35),
('Butter', 'Dairy', 90, 2.00),
('Oats', 'Grain', 180, 0.60),
('Cucumber', 'Vegetable', 7, 0.30),
('Strawberry', 'Fruit', 5, 0.70),
('Blueberry', 'Fruit', 7, 0.80),
('Beef', 'Protein', 5, 5.00),
('Pork', 'Protein', 4, 4.00),
('Lettuce', 'Vegetable', 5, 0.50),
('Cabbage', 'Vegetable', 20, 0.45),
('Mango', 'Fruit', 10, 1.00),
('Pineapple', 'Fruit', 10, 1.50),
('Cereal', 'Grain', 365, 3.00),
('Flour', 'Grain', 365, 1.20),
('Sugar', 'Grain', 730, 0.50),
('Salt', 'Grain', 1825, 0.20),
('Honey', 'Spread', 730, 3.50),
('Jam', 'Spread', 180, 2.00),
('Coffee', 'Beverage', 365, 4.00),
('Tea', 'Beverage', 365, 2.50),
('Orange Juice', 'Beverage', 10, 2.00),
('Apple Juice', 'Beverage', 10, 2.20),
('Yogurt Drink', 'Beverage', 7, 1.50),
('Cheddar Cheese', 'Dairy', 60, 3.00),
('Mozzarella', 'Dairy', 30, 2.80),
('Bagel', 'Grain', 7, 1.20),
('Tortilla', 'Grain', 30, 1.50),
('Walnuts', 'Nuts', 180, 0.15),
('Cashews', 'Nuts', 180, 0.20),
('Lentils', 'Protein', 365, 1.00),
('Chickpeas', 'Protein', 365, 1.10),
('Coconut', 'Fruit', 30, 1.50),
('Avocado', 'Fruit', 7, 1.20),
('Grapes', 'Fruit', 7, 0.80),
('Kiwi', 'Fruit', 10, 0.90)
ON CONFLICT DO NOTHING;

-- Food usage logs table
CREATE TABLE IF NOT EXISTS food_usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_food_usage_logs_user_id ON food_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_usage_logs_usage_date ON food_usage_logs(usage_date);
CREATE INDEX IF NOT EXISTS idx_food_usage_logs_user_date ON food_usage_logs(user_id, usage_date);

-- User inventory table (personal inventory list)
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
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_expiration_date ON user_inventory(expiration_date);

-- Community posts table
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
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for community tables
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);

-- Resources table for tips on waste reduction and nutrition
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for resources table
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);

-- Seed resources data
INSERT INTO resources (title, description, url, category, type) VALUES
-- 1–10: Waste Reduction
('Zero-Waste Kitchen Basics', 'Guide to reducing kitchen waste through simple daily habits.', 'https://example.com/zwk', 'waste_reduction', 'article'),
('Composting 101', 'Beginner-friendly introduction to composting food scraps.', 'https://example.com/compost', 'waste_reduction', 'article'),
('How to Reduce Food Waste at Home', 'Practical steps to cut food waste by 50%.', 'https://example.com/reducewaste', 'waste_reduction', 'article'),
('Zero-Waste Beginner Video', 'Short video explaining how to start a zero-waste lifestyle.', 'https://example.com/zerowastevid', 'waste_reduction', 'video'),
('Proper Food Scrap Storage', 'Learn how to store scraps for composting or reuse.', 'https://example.com/scrap-storage', 'waste_reduction', 'guide'),
('Leftover Makeover Recipes', 'Ideas for turning leftovers into new meals.', 'https://example.com/leftovers', 'waste_reduction', 'article'),
('How to Reuse Vegetable Peels', 'Creative uses for peels to avoid waste.', 'https://example.com/vegpeels', 'waste_reduction', 'guide'),
('Food Waste Tracking Template', 'Spreadsheet to track and reduce weekly waste.', 'https://example.com/fwt', 'waste_reduction', 'guide'),
('Batch Cooking Guide', 'Cook in batches to reduce waste and save time.', 'https://example.com/batchcook', 'waste_reduction', 'article'),
('Understanding Expiry Labels', 'Difference between expiry, best-before, and sell-by dates.', 'https://example.com/expiry', 'waste_reduction', 'article'),

-- 11–20: Nutrition
('Basics of Balanced Nutrition', 'Overview of macro- and micronutrients.', 'https://example.com/balanced', 'nutrition', 'article'),
('Healthy Plate Model', 'Visual breakdown of a balanced meal.', 'https://example.com/plate', 'nutrition', 'guide'),
('High-Protein Vegetarian Meals', 'List of affordable high-protein dishes.', 'https://example.com/proteinveg', 'nutrition', 'article'),
('Nutrition for Students', 'Cheap and simple nutrition tips for learners.', 'https://example.com/students', 'nutrition', 'guide'),
('Hydration Tips', 'How much water you should drink daily.', 'https://example.com/water', 'nutrition', 'article'),
('Deficiencies Explained', 'Symptoms and prevention of common nutrient deficiencies.', 'https://example.com/deficiency', 'nutrition', 'article'),
('Fiber-Rich Foods List', 'Foods that promote digestion.', 'https://example.com/fiber', 'nutrition', 'guide'),
('Meal Balanced Video Guide', 'Short video explaining balanced meal breakdown.', 'https://example.com/nutritionvid', 'nutrition', 'video'),
('Low-Budget Healthy Foods', '21 cheap nutritious foods anyone can buy.', 'https://example.com/budgetfoods', 'nutrition', 'article'),
('Quick Healthy Snacks', 'List of 5-minute nutritious snacks.', 'https://example.com/quick-snacks', 'nutrition', 'guide'),

-- 21–30: Meal Planning
('Weekly Meal Planning Template', 'Ready-made layout for planning meals.', 'https://example.com/template', 'meal_planning', 'guide'),
('Meal Prep for Beginners', 'Steps to prepare meals for the full week.', 'https://example.com/mealprep', 'meal_planning', 'article'),
('Healthy Meal Prep Video', 'Visual walkthrough of a 5-day meal plan.', 'https://example.com/mealvid', 'meal_planning', 'video'),
('How to Choose 10 Core Ingredients', 'Plan meals around versatile ingredients.', 'https://example.com/core', 'meal_planning', 'guide'),
('Budget-Friendly Meal Plan', 'Weekly plan costing under $20.', 'https://example.com/budgetplan', 'meal_planning', 'article'),
('Vegetarian Meal Planning', 'Plant-based meal plan for beginners.', 'https://example.com/vegplan', 'meal_planning', 'guide'),
('Macro-Friendly Meal Plan', 'Meal planning for fitness goals.', 'https://example.com/macro', 'meal_planning', 'article'),
('Batch Cooking Meal Plan', 'Five recipes designed for batch cooking.', 'https://example.com/batchplan', 'meal_planning', 'guide'),
('30-Minute Meal Plan', 'Plan built around fast and simple recipes.', 'https://example.com/30min', 'meal_planning', 'article'),
('Meal Planning Mistakes to Avoid', 'Top pitfalls and how to fix them.', 'https://example.com/mistakes', 'meal_planning', 'article'),

-- 31–40: Storage Tips
('Food Storage Basics', 'Where to store common foods.', 'https://example.com/storage', 'storage_tips', 'guide'),
('Fridge Organization 101', 'How to properly organize the refrigerator.', 'https://example.com/fridge', 'storage_tips', 'article'),
('Freeze Like a Pro', 'How to freeze foods without losing quality.', 'https://example.com/freezing', 'storage_tips', 'guide'),
('Vegetable Storage Chart', 'Chart of how long veggies last in fridge/pantry.', 'https://example.com/vegchart', 'storage_tips', 'guide'),
('How to Store Cooked Rice Safely', 'Prevent bacterial growth in cooked rice.', 'https://example.com/rice', 'storage_tips', 'article'),
('Shelf-Life Guide', 'Shelf life of common pantry items.', 'https://example.com/shelflife', 'storage_tips', 'article'),
('Airtight Containers Guide', 'Choosing proper containers for storage.', 'https://example.com/containers', 'storage_tips', 'guide'),
('How to Avoid Freezer Burn', 'Techniques to store frozen food correctly.', 'https://example.com/freezerburn', 'storage_tips', 'article'),
('Leftover Storage Rules', 'How long leftovers last + safety rules.', 'https://example.com/leftoverstorage', 'storage_tips', 'guide'),
('Proper Meat Storage', 'Temperature and packaging rules.', 'https://example.com/meat', 'storage_tips', 'article'),

-- 41–50: Budget & Savings
('Smart Grocery Shopping', 'How to shop cheap but healthy.', 'https://example.com/smartshop', 'budget', 'guide'),
('10 Cheapest High-Nutrition Foods', 'Maximize nutrition on a budget.', 'https://example.com/cheapnutri', 'budget', 'article'),
('Monthly Grocery Budget Planner', 'Simple worksheet for planning.', 'https://example.com/budgetsheet', 'budget', 'guide'),
('Cooking on a Tight Budget', 'Meals that cost less than $1.', 'https://example.com/1dollar', 'budget', 'article'),
('Batch Cooking to Save Money', 'Save 30% with batch meals.', 'https://example.com/batchsave', 'budget', 'article'),
('How to Stop Impulse Buying', 'Behavioral tips that save money.', 'https://example.com/impulse', 'budget', 'guide'),
('Affordable Protein Sources', 'Cheap alternatives to meat.', 'https://example.com/cheapprotein', 'budget', 'article'),
('Price Comparison Chart', 'Compare prices of common staples.', 'https://example.com/pricechart', 'budget', 'guide'),
('Coupons & Discounts Guide', 'How to use discounts effectively.', 'https://example.com/coupons', 'budget', 'guide'),
('Storing Food to Save Money', 'Prevent spoilage and waste to cut costs.', 'https://example.com/storesavemoney', 'budget', 'article')
ON CONFLICT DO NOTHING;