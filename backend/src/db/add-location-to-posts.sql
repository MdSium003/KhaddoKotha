-- Migration: Add location fields to community_posts table
-- Run this to add location support to existing posts

ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_community_posts_location ON community_posts(latitude, longitude);

SELECT 'Location fields added to community_posts table successfully!' AS status;

