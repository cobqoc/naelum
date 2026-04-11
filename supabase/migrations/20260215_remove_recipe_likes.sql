-- Migration: Remove recipe likes feature
-- Date: 2026-02-15
-- Description: 좋아요 기능을 제거하고 "만들어봤어요" 시스템으로 대체

-- 1. Drop trigger first
DROP TRIGGER IF EXISTS trigger_update_recipe_likes ON recipe_likes;

-- 2. Drop RPC functions
DROP FUNCTION IF EXISTS increment_likes_count(UUID);
DROP FUNCTION IF EXISTS decrement_likes_count(UUID);

-- 3. Drop recipe_likes table
DROP TABLE IF EXISTS recipe_likes CASCADE;

-- 4. Reset likes_count to 0 in recipes table
-- (keeping the column for potential future use or analytics)
UPDATE recipes SET likes_count = 0 WHERE likes_count > 0;

-- 5. Add comment explaining the column is deprecated
COMMENT ON COLUMN recipes.likes_count IS 'DEPRECATED: This column is no longer used. Recipe popularity is now measured by cooked_count (number of users who completed the recipe).';

-- Optional: Create a view to show cooked_count as the new popularity metric
CREATE OR REPLACE VIEW recipe_popularity AS
SELECT
  r.id,
  r.title,
  r.author_id,
  COUNT(DISTINCT cs.user_id) FILTER (WHERE cs.completed_at IS NOT NULL) AS cooked_count,
  r.average_rating,
  r.ratings_count,
  r.saves_count,
  r.comments_count,
  r.views_count
FROM recipes r
LEFT JOIN cooking_sessions cs ON r.id = cs.recipe_id
GROUP BY r.id;

-- Add comment to the view
COMMENT ON VIEW recipe_popularity IS 'Shows recipe popularity metrics with cooked_count (number of users who completed the recipe) replacing likes_count';

-- Grant access to authenticated users
GRANT SELECT ON recipe_popularity TO authenticated;
GRANT SELECT ON recipe_popularity TO anon;
