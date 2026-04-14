-- Sync all RLS policies from production to dev
-- Applied 2026-04-13
-- Context: dev DB had RLS enabled on all tables but zero policies,
-- causing anon client-side queries (recipes, tips, etc.) to return empty results.

-- badges
CREATE POLICY "badges_public_read" ON badges
  FOR SELECT TO public USING (true);

-- comment_likes
CREATE POLICY "comment_likes_public_read" ON comment_likes
  FOR SELECT TO public USING (true);
CREATE POLICY "comment_likes_own_insert" ON comment_likes
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_likes_own_delete" ON comment_likes
  FOR DELETE TO public USING (auth.uid() = user_id);

-- contact_inquiries
CREATE POLICY "Anyone can submit inquiry" ON contact_inquiries
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view own inquiries" ON contact_inquiries
  FOR SELECT TO public USING (auth.uid() = user_id);

-- cooking_sessions
CREATE POLICY "Users can manage own cooking sessions" ON cooking_sessions
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_stats
CREATE POLICY "daily_stats_public_read" ON daily_stats
  FOR SELECT TO public USING (true);

-- experience_logs
CREATE POLICY "experience_logs_own_read" ON experience_logs
  FOR SELECT TO public USING (auth.uid() = user_id);

-- ingredient_training_data
CREATE POLICY "Users can view own training data" ON ingredient_training_data
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training data" ON ingredient_training_data
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all training data" ON ingredient_training_data
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND (users.raw_user_meta_data ->> 'role') = 'admin')
  );
CREATE POLICY "Admins can update training data" ON ingredient_training_data
  FOR UPDATE TO public USING (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND (users.raw_user_meta_data ->> 'role') = 'admin')
  );

-- ingredients_master
CREATE POLICY "Public can view approved ingredients" ON ingredients_master
  FOR SELECT TO public USING (status = 'approved');
CREATE POLICY "Authenticated users can insert ingredients" ON ingredients_master
  FOR INSERT TO public WITH CHECK (auth.uid() = created_by AND status = 'pending');
CREATE POLICY "Admins can view all ingredients" ON ingredients_master
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
CREATE POLICY "Admins can update ingredients" ON ingredients_master
  FOR UPDATE TO public USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
CREATE POLICY "Admins can delete ingredients" ON ingredients_master
  FOR DELETE TO public USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- meal_plans
CREATE POLICY "meal_plans_own_all" ON meal_plans
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- meal_plan_items
CREATE POLICY "meal_plan_items_own_all" ON meal_plan_items
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = meal_plan_items.meal_plan_id AND meal_plans.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = meal_plan_items.meal_plan_id AND meal_plans.user_id = auth.uid()));

-- notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO public USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO public WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO public USING (auth.uid() = id);

-- recipe_comments
CREATE POLICY "Comments are viewable by everyone" ON recipe_comments
  FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create comments" ON recipe_comments
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON recipe_comments
  FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON recipe_comments
  FOR DELETE TO public USING (auth.uid() = user_id);

-- recipe_folders
CREATE POLICY "recipe_folders_own_all" ON recipe_folders
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- recipe_ingredients
CREATE POLICY "recipe_ingredients_public_read" ON recipe_ingredients
  FOR SELECT TO public USING (true);

-- recipe_likes
CREATE POLICY "recipe_likes_select" ON recipe_likes
  FOR SELECT TO public USING (true);
CREATE POLICY "recipe_likes_insert" ON recipe_likes
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipe_likes_delete" ON recipe_likes
  FOR DELETE TO public USING (auth.uid() = user_id);

-- recipe_notes
CREATE POLICY "recipe_notes_public_read" ON recipe_notes
  FOR SELECT TO public USING (true);

-- recipe_ratings
CREATE POLICY "recipe_ratings_public_read" ON recipe_ratings
  FOR SELECT TO public USING (true);
CREATE POLICY "recipe_ratings_own_insert" ON recipe_ratings
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipe_ratings_own_update" ON recipe_ratings
  FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "recipe_ratings_own_delete" ON recipe_ratings
  FOR DELETE TO public USING (auth.uid() = user_id);

-- recipe_saves
CREATE POLICY "Users can manage own saves" ON recipe_saves
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- recipe_steps
CREATE POLICY "recipe_steps_public_read" ON recipe_steps
  FOR SELECT TO public USING (true);

-- recipe_tags
CREATE POLICY "recipe_tags_public_read" ON recipe_tags
  FOR SELECT TO public USING (true);

-- recipe_views
CREATE POLICY "recipe_views_public_read" ON recipe_views
  FOR SELECT TO public USING (true);
CREATE POLICY "recipe_views_own_insert" ON recipe_views
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- recipes
CREATE POLICY "Published recipes are viewable by everyone" ON recipes
  FOR SELECT TO public USING (status = 'published' OR auth.uid() = author_id);
CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT TO public WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE TO public USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE TO public USING (auth.uid() = author_id);

-- recommendation_history
CREATE POLICY "recommendation_history_own_all" ON recommendation_history
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT TO public WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT TO public USING (reporter_id = auth.uid());

-- search_history
CREATE POLICY "search_history_own_all" ON search_history
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shopping_lists
CREATE POLICY "shopping_lists_own_all" ON shopping_lists
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shopping_list_items
CREATE POLICY "shopping_list_items_own_all" ON shopping_list_items
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tip
CREATE POLICY "Public tip readable" ON tip
  FOR SELECT TO public USING (is_public = true OR auth.uid() = author_id);
CREATE POLICY "Author insert tip" ON tip
  FOR INSERT TO public WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author update tip" ON tip
  FOR UPDATE TO public USING (auth.uid() = author_id);
CREATE POLICY "Author delete tip" ON tip
  FOR DELETE TO public USING (auth.uid() = author_id);

-- tip_steps
CREATE POLICY "Tip steps readable" ON tip_steps
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM tip WHERE tip.id = tip_steps.tip_id AND (tip.is_public = true OR tip.author_id = auth.uid()))
  );
CREATE POLICY "Author manages tip steps" ON tip_steps
  FOR ALL TO public USING (
    EXISTS (SELECT 1 FROM tip WHERE tip.id = tip_steps.tip_id AND tip.author_id = auth.uid())
  );

-- tip_tags
CREATE POLICY "Tip tags readable" ON tip_tags
  FOR SELECT TO public USING (true);
CREATE POLICY "Author manages tip tags" ON tip_tags
  FOR ALL TO public USING (
    EXISTS (SELECT 1 FROM tip WHERE tip.id = tip_tags.tip_id AND tip.author_id = auth.uid())
  );

-- translations
CREATE POLICY "translations_public_read" ON translations
  FOR SELECT TO public USING (true);

-- trending_searches
CREATE POLICY "trending_searches_public_read" ON trending_searches
  FOR SELECT TO public USING (true);

-- user_allergies
CREATE POLICY "Users can view their own allergies" ON user_allergies
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own allergies" ON user_allergies
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own allergies" ON user_allergies
  FOR UPDATE TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own allergies" ON user_allergies
  FOR DELETE TO public USING (auth.uid() = user_id);

-- user_badges
CREATE POLICY "user_badges_public_read" ON user_badges
  FOR SELECT TO public USING (true);

-- user_blocks
CREATE POLICY "Users can view their own blocks" ON user_blocks
  FOR SELECT TO public USING (auth.uid() = blocker_id);
CREATE POLICY "Users can insert their own blocks" ON user_blocks
  FOR INSERT TO public WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete their own blocks" ON user_blocks
  FOR DELETE TO public USING (auth.uid() = blocker_id);

-- user_dietary_preferences
CREATE POLICY "Users can view their own dietary preferences" ON user_dietary_preferences
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own dietary preferences" ON user_dietary_preferences
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dietary preferences" ON user_dietary_preferences
  FOR UPDATE TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dietary preferences" ON user_dietary_preferences
  FOR DELETE TO public USING (auth.uid() = user_id);

-- user_follows
CREATE POLICY "user_follows_public_read" ON user_follows
  FOR SELECT TO public USING (true);
CREATE POLICY "user_follows_own_insert" ON user_follows
  FOR INSERT TO public WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "user_follows_own_delete" ON user_follows
  FOR DELETE TO public USING (auth.uid() = follower_id);

-- user_ingredients
CREATE POLICY "Users can manage own ingredients" ON user_ingredients
  FOR ALL TO public USING (auth.uid() = user_id);

-- user_interests
CREATE POLICY "Users can view their own interests" ON user_interests
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interests" ON user_interests
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interests" ON user_interests
  FOR UPDATE TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interests" ON user_interests
  FOR DELETE TO public USING (auth.uid() = user_id);

-- user_terms_acceptance
CREATE POLICY "Users can view their own terms acceptance" ON user_terms_acceptance
  FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own terms acceptance" ON user_terms_acceptance
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own terms acceptance" ON user_terms_acceptance
  FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all terms acceptance" ON user_terms_acceptance
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
