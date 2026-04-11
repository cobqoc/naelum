-- Function to update recipe's average rating and ratings count
CREATE OR REPLACE FUNCTION update_recipe_ratings(recipe_id UUID)
RETURNS TABLE(average_rating NUMERIC, ratings_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating NUMERIC;
  count_ratings INTEGER;
BEGIN
  -- Calculate average rating and count
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    COALESCE(COUNT(*)::integer, 0)
  INTO avg_rating, count_ratings
  FROM recipe_ratings
  WHERE recipe_ratings.recipe_id = update_recipe_ratings.recipe_id;

  -- Update the recipes table
  UPDATE recipes
  SET
    average_rating = avg_rating,
    ratings_count = count_ratings
  WHERE id = update_recipe_ratings.recipe_id;

  -- Return the new values
  RETURN QUERY SELECT avg_rating, count_ratings;
END;
$$;
