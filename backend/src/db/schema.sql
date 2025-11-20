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
