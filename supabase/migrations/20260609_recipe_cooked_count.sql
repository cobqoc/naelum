-- #5 engagement: 레시피 "만들어봤어요" 전역 카운트 교정.
--
-- 문제: cooking_sessions 의 SELECT RLS 가 본인-only(auth.uid() = user_id)라,
-- 레시피 상세의 cooked_count(전역 "N명이 만들었어요")가 RLS 필터로 본인 것만(0/1) 세였다.
-- 비로그인은 0. 화면에 표시되는 사회적 증거 값이 항상 틀림.
--
-- 해결: SECURITY DEFINER 함수로 RLS 우회해 완료 세션 전체를 집계. read-only(STABLE).
-- search_path 고정(보안 advisor 권장). anon·authenticated 모두 실행 가능(상세는 공개).

CREATE OR REPLACE FUNCTION public.recipe_cooked_count(p_recipe_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM cooking_sessions
  WHERE recipe_id = p_recipe_id
    AND completed_at IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.recipe_cooked_count(uuid) TO anon, authenticated;
