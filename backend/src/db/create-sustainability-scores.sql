-- Sustainability Points System Tables

-- Add total_score column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;

-- Create user_scores table to track daily score breakdowns
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
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN ('nutri_ninja', 'waste_warrior', 'budget_boss')),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_date ON user_scores(score_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

SELECT 'Sustainability scores tables created successfully!' AS status;

