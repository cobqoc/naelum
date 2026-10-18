-- 레시피 자식 행을 부모 레시피 공개 범위에 맞춘다 (2026-10-04 감사 API1-18) + 만들어봤어요 '명' 수 복원 (API1-02)
--
-- 1) recipe_ingredients·recipe_steps·recipe_tags·recipe_posts 의 SELECT 정책이 USING (true) 라 비공개·임시저장
--    레시피의 재료·단계·태그·리뷰/댓글이 anon 키로도 열람됐다. 부모 recipes 를 EXISTS 로 참조하면 그 서브쿼리에
--    recipes 자신의 RLS(published OR 작성자 본인)가 그대로 적용돼 "부모가 보이는 자식만" 보인다.
--    service-role(관리자 화면·cron·내보내기)은 RLS 를 우회하므로 영향 없음. recipe_id 는 FK 인덱스 보유.
DROP POLICY IF EXISTS "recipe_ingredients_public_read" ON public.recipe_ingredients;
CREATE POLICY "recipe_ingredients_read_with_parent" ON public.recipe_ingredients
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_ingredients.recipe_id));

DROP POLICY IF EXISTS "recipe_steps_public_read" ON public.recipe_steps;
CREATE POLICY "recipe_steps_read_with_parent" ON public.recipe_steps
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_steps.recipe_id));

DROP POLICY IF EXISTS "recipe_tags_public_read" ON public.recipe_tags;
CREATE POLICY "recipe_tags_read_with_parent" ON public.recipe_tags
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_tags.recipe_id));

DROP POLICY IF EXISTS "recipe posts readable by all" ON public.recipe_posts;
DROP POLICY IF EXISTS "recipe_posts readable by all" ON public.recipe_posts;
CREATE POLICY "recipe_posts_read_with_parent" ON public.recipe_posts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_posts.recipe_id));

-- 2) recipe_cooked_count — 20260609 가 20260602 의 COUNT(DISTINCT user_id) 를 COUNT(*) 로 덮어써, 한 사람이 두 번
--    완성하면 "2명이 만들어봤어요" 로 표시됐다. 화면 문구('명')대로 사람 수로 되돌린다.
CREATE OR REPLACE FUNCTION public.recipe_cooked_count(p_recipe_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(DISTINCT user_id)::integer
  FROM cooking_sessions
  WHERE recipe_id = p_recipe_id
    AND completed_at IS NOT NULL;
$function$;
