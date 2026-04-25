-- Fix Supabase security advisor warnings:
-- 1. Views: add security_invoker = true
-- 2. Functions: set search_path = public

-- ============================================================
-- Views: security_invoker
-- ============================================================

CREATE OR REPLACE VIEW public.popular_recipes WITH (security_invoker = true) AS
 SELECT r.id,
    r.author_id,
    r.title,
    r.description,
    r.thumbnail_url,
    r.video_url,
    r.servings,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.total_time_minutes,
    r.difficulty_level,
    r.cuisine_type,
    r.dish_type,
    r.meal_type,
    r.calories,
    r.protein_grams,
    r.carbs_grams,
    r.fat_grams,
    r.fiber_grams,
    r.is_vegetarian,
    r.is_vegan,
    r.is_gluten_free,
    r.is_dairy_free,
    r.is_low_carb,
    r.views_count,
    r.likes_count,
    r.saves_count,
    r.comments_count,
    r.shares_count,
    r.average_rating,
    r.ratings_count,
    r.original_recipe_id,
    r.is_remix,
    r.is_featured,
    r.published_at,
    r.created_at,
    r.updated_at,
    r.search_vector,
    r.ingredients_image_url,
    r.display_image,
    r.sodium_mg,
    r.status,
    p.username AS author_username,
    p.avatar_url AS author_avatar
   FROM (recipes r
     JOIN profiles p ON ((r.author_id = p.id)))
  WHERE (r.status = 'published'::text)
  ORDER BY (((((r.likes_count * 2) + (r.saves_count * 3)))::numeric + ((r.views_count)::numeric * 0.1)) + (r.average_rating * (10)::numeric)) DESC;

CREATE OR REPLACE VIEW public.recipe_popularity WITH (security_invoker = true) AS
 SELECT r.id,
    r.title,
    r.author_id,
    count(DISTINCT cs.user_id) FILTER (WHERE (cs.completed_at IS NOT NULL)) AS cooked_count,
    r.average_rating,
    r.ratings_count,
    r.saves_count,
    r.comments_count,
    r.views_count
   FROM (recipes r
     LEFT JOIN cooking_sessions cs ON ((r.id = cs.recipe_id)))
  GROUP BY r.id;

-- ============================================================
-- Functions: set search_path = public
-- ============================================================

ALTER FUNCTION public.approve_ingredient(p_canonical_name text, p_allergens text[], p_tier integer, p_typical_min numeric, p_typical_max numeric, p_typical_unit text) SET search_path = public;
ALTER FUNCTION public.check_rate_limit(p_identifier text, p_window_ms bigint, p_max_requests integer) SET search_path = public;
ALTER FUNCTION public.cleanup_rate_limits() SET search_path = public;
ALTER FUNCTION public.compute_fingerprints() SET search_path = public;
ALTER FUNCTION public.generate_recipe_slug() SET search_path = public;
ALTER FUNCTION public.generate_tip_slug() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_report_unpublish() SET search_path = public;
ALTER FUNCTION public.increment_recipe_views(recipe_id uuid) SET search_path = public;
ALTER FUNCTION public.is_user_banned(check_user_id uuid) SET search_path = public;
ALTER FUNCTION public.remove_oauth_identity(p_user_id uuid, p_provider text) SET search_path = public;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
ALTER FUNCTION public.toggle_comment_like(p_comment_id uuid, p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.toggle_recipe_like(p_recipe_id uuid, p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.update_comment_likes_count() SET search_path = public;
ALTER FUNCTION public.update_follow_counts() SET search_path = public;
ALTER FUNCTION public.update_ingredient_recognition_feedback_updated_at() SET search_path = public;
ALTER FUNCTION public.update_profile_recipes_count() SET search_path = public;
ALTER FUNCTION public.update_recipe_comments_count() SET search_path = public;
ALTER FUNCTION public.update_recipe_display_image() SET search_path = public;
ALTER FUNCTION public.update_recipe_display_image_on_steps_change() SET search_path = public;
ALTER FUNCTION public.update_recipe_likes_count() SET search_path = public;
ALTER FUNCTION public.update_recipe_rating() SET search_path = public;
ALTER FUNCTION public.update_recipe_ratings(recipe_id uuid) SET search_path = public;
ALTER FUNCTION public.update_recipe_saves_count() SET search_path = public;
ALTER FUNCTION public.update_training_data_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
