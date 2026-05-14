-- increment/decrement_saves_count RPC 수정
--
-- 문제: save route가 recipe_saves INSERT/DELETE 직후 RPC를 별도 호출하는데,
--       update_recipe_saves_count 트리거도 동시에 발동해 이중 반영 발생.
--       (저장 시 +2, 취소 시 -2 → 음수 버그의 근본 원인 중 하나)
--
-- 수정: RPC를 no-op으로 교체 — 정확한 COUNT(*) 기반 트리거가 단독 담당

CREATE OR REPLACE FUNCTION public.increment_saves_count(recipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- update_recipe_saves_count 트리거(recipe_saves INSERT/DELETE)가 COUNT(*) 기반으로 정확히 관리
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_saves_count(recipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- update_recipe_saves_count 트리거(recipe_saves INSERT/DELETE)가 COUNT(*) 기반으로 정확히 관리
  NULL;
END;
$$;
