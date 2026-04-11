-- Function to increment likes count for a recipe
CREATE OR REPLACE FUNCTION increment_likes_count(recipe_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE recipes
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = recipe_id
  RETURNING likes_count INTO new_count;

  RETURN new_count;
END;
$$;

-- Function to decrement likes count for a recipe
CREATE OR REPLACE FUNCTION decrement_likes_count(recipe_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE recipes
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = recipe_id
  RETURNING likes_count INTO new_count;

  RETURN new_count;
END;
$$;
