-- Migration: Add AI Features Tables
-- Description: Adds tables for expiration risk prediction and waste estimation

DROP TABLE IF EXISTS expiration_risk_scores CASCADE;
DROP TABLE IF EXISTS waste_records CASCADE;
DROP TABLE IF EXISTS waste_estimates CASCADE;
DROP TABLE IF EXISTS expiration_alerts CASCADE;
DROP TABLE IF EXISTS community_waste_stats CASCADE;

-- Table: expiration_risk_scores
-- Stores AI-calculated risk scores for-- Expiration Risk Scores Table
CREATE TABLE IF NOT EXISTS expiration_risk_scores (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inventory_item_id INT NOT NULL UNIQUE REFERENCES user_inventory(id) ON DELETE CASCADE,
    risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    consumption_frequency NUMERIC(4,2) DEFAULT 0,
    category_risk_factor NUMERIC(3,2) DEFAULT 1.0,
    seasonal_factor NUMERIC(3,2) DEFAULT 1.0,
    explanation TEXT,
    calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_user ON expiration_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_score ON expiration_risk_scores(risk_score DESC);

-- Table: waste_records
-- Tracks actual wasted items for pattern learning
CREATE TABLE IF NOT EXISTS waste_records (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity_grams NUMERIC(10,2) NOT NULL,
  cost_wasted NUMERIC(10,2),
  reason VARCHAR(100), -- expired, spoiled, over-purchased, etc.
  wasted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for pattern analysis
CREATE INDEX IF NOT EXISTS idx_waste_records_user_id ON waste_records(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_records_date ON waste_records(wasted_date DESC);
CREATE INDEX IF NOT EXISTS idx_waste_records_category ON waste_records(category);

-- Table: waste_estimates
-- Stores weekly and monthly waste projections
CREATE TABLE IF NOT EXISTS waste_estimates (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estimate_type VARCHAR(20) NOT NULL CHECK (estimate_type IN ('weekly', 'monthly')),
  estimated_grams NUMERIC(10,2) NOT NULL,
  estimated_cost NUMERIC(10,2) NOT NULL,
  confidence_score NUMERIC(5,2), -- 0-100
  projection_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for projections
CREATE INDEX IF NOT EXISTS idx_waste_estimates_user_id ON waste_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_estimates_date ON waste_estimates(projection_date DESC);
CREATE INDEX IF NOT EXISTS idx_waste_estimates_type ON waste_estimates(estimate_type);

-- Table: expiration_alerts
-- Manages in-app alerts for high-risk items
CREATE TABLE IF NOT EXISTS expiration_alerts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inventory_item_id INT NOT NULL REFERENCES user_inventory(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- high_risk, expiring_soon, consume_now
  risk_score NUMERIC(5,2) NOT NULL,
  message TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for active alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON expiration_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON expiration_alerts(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON expiration_alerts(created_at DESC);

-- Table: community_waste_stats
-- Aggregated community data for comparisons (initially seeded with dummy data)
CREATE TABLE IF NOT EXISTS community_waste_stats (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  avg_waste_grams_weekly NUMERIC(10,2) NOT NULL,
  avg_waste_cost_weekly NUMERIC(10,2) NOT NULL,
  avg_waste_grams_monthly NUMERIC(10,2) NOT NULL,
  avg_waste_cost_monthly NUMERIC(10,2) NOT NULL,
  sample_size INT DEFAULT 100, -- number of users in average
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for category lookup
CREATE INDEX IF NOT EXISTS idx_community_stats_category ON community_waste_stats(category);

-- Seed community stats with dummy data
INSERT INTO community_waste_stats (category, avg_waste_grams_weekly, avg_waste_cost_weekly, avg_waste_grams_monthly, avg_waste_cost_monthly) VALUES
('Fruit', 150.00, 3.50, 600.00, 14.00),
('Vegetable', 200.00, 4.00, 800.00, 16.00),
('Dairy', 100.00, 2.50, 400.00, 10.00),
('Grain', 50.00, 1.00, 200.00, 4.00),
('Protein', 120.00, 6.00, 480.00, 24.00),
('Nuts', 20.00, 0.50, 80.00, 2.00),
('Spread', 30.00, 1.00, 120.00, 4.00),
('Beverage', 100.00, 2.00, 400.00, 8.00)
ON CONFLICT DO NOTHING;
