-- Add missing columns to user_ingredients table
-- Part of Phase 1.1: Database Migration for Ingredients Management Enhancement

-- Add category column (if not exists)
-- This column stores the ingredient category (veggie, meat, seafood, etc.)
ALTER TABLE user_ingredients
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add notes column for user memos
-- This allows users to add personal notes about ingredients
ALTER TABLE user_ingredients
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for category filtering
-- This improves performance when filtering ingredients by category
CREATE INDEX IF NOT EXISTS idx_user_ingredients_category
ON user_ingredients(category);

-- Add composite index for expiry date queries
-- This optimizes queries that filter by user_id and expiry_date
CREATE INDEX IF NOT EXISTS idx_user_ingredients_user_expiry
ON user_ingredients(user_id, expiry_date)
WHERE expiry_date IS NOT NULL;

-- Add comments to describe the new columns
COMMENT ON COLUMN user_ingredients.category IS 'Ingredient category from ingredients_master or user-defined (veggie, meat, seafood, grain, dairy, seasoning, fruit, other)';
COMMENT ON COLUMN user_ingredients.notes IS 'User personal notes/memos about this ingredient (e.g., "Best before Dec 2025", "Homemade kimchi")';
