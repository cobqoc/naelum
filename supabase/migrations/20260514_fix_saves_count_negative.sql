-- saves_count 음수 버그 수정
--
-- 문제: recipe_saves 행 삭제 시 saves_count가 이미 0이어도 계속 감소해 음수가 됨
-- 수정:
--  1. 기존 음수 데이터 교정 (실제 저장 수로 재계산)
--  2. 트리거 함수를 GREATEST(0, count) 기반으로 교체
--  3. CHECK 제약 추가로 향후 음수 진입 원천 차단

-- 1. 기존 음수 saves_count를 실제 저장 수로 재계산
UPDATE recipes r
SET saves_count = COALESCE((
  SELECT COUNT(*)::int
  FROM recipe_saves rs
  WHERE rs.recipe_id = r.id
), 0)
WHERE r.saves_count < 0;

-- 2. 트리거 함수 교체 — DELETE 시 GREATEST(0, actual_count) 보장
CREATE OR REPLACE FUNCTION public.update_recipe_saves_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE recipes
    SET saves_count = GREATEST(0, (
      SELECT COUNT(*)::int FROM recipe_saves WHERE recipe_id = NEW.recipe_id
    ))
    WHERE id = NEW.recipe_id;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE recipes
    SET saves_count = GREATEST(0, (
      SELECT COUNT(*)::int FROM recipe_saves WHERE recipe_id = OLD.recipe_id
    ))
    WHERE id = OLD.recipe_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. CHECK 제약 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saves_count_non_negative' AND conrelid = 'recipes'::regclass
  ) THEN
    ALTER TABLE recipes ADD CONSTRAINT saves_count_non_negative CHECK (saves_count >= 0);
  END IF;
END;
$$;
