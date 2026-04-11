-- recipes 테이블에 display_image 컬럼 추가
-- 레시피 카드에 표시할 최적 이미지를 미리 계산해서 저장
ALTER TABLE recipes
ADD COLUMN display_image TEXT;

-- 인덱스 생성 (검색 성능 최적화 - 필요시)
-- CREATE INDEX idx_recipes_display_image ON recipes(display_image) WHERE display_image IS NOT NULL;

-- 기존 레시피의 display_image 업데이트 함수
CREATE OR REPLACE FUNCTION update_recipe_display_image()
RETURNS TRIGGER AS $$
BEGIN
  -- 우선순위: thumbnail_url → 마지막 단계 image_url → 다른 단계 image_url → ingredients_image_url → null

  -- 1순위: thumbnail_url
  IF NEW.thumbnail_url IS NOT NULL THEN
    NEW.display_image := NEW.thumbnail_url;
    RETURN NEW;
  END IF;

  -- 2-3순위: 단계 이미지 (뒤에서부터 찾기)
  SELECT image_url INTO NEW.display_image
  FROM recipe_steps
  WHERE recipe_id = NEW.id AND image_url IS NOT NULL
  ORDER BY step_number DESC
  LIMIT 1;

  IF NEW.display_image IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 4순위: ingredients_image_url
  IF NEW.ingredients_image_url IS NOT NULL THEN
    NEW.display_image := NEW.ingredients_image_url;
    RETURN NEW;
  END IF;

  -- 5순위: null
  NEW.display_image := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (INSERT 및 UPDATE 시 자동으로 display_image 계산)
CREATE TRIGGER trigger_update_recipe_display_image
BEFORE INSERT OR UPDATE OF thumbnail_url, ingredients_image_url ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_recipe_display_image();

-- recipe_steps 변경 시에도 display_image 업데이트
CREATE OR REPLACE FUNCTION update_recipe_display_image_on_steps_change()
RETURNS TRIGGER AS $$
DECLARE
  step_image TEXT;
BEGIN
  -- 해당 레시피의 단계 이미지 가져오기
  SELECT image_url INTO step_image
  FROM recipe_steps
  WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id) AND image_url IS NOT NULL
  ORDER BY step_number DESC
  LIMIT 1;

  -- 레시피의 display_image 업데이트
  UPDATE recipes
  SET
    display_image = COALESCE(
      thumbnail_url,
      step_image,
      ingredients_image_url
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- recipe_steps 변경 시 트리거
CREATE TRIGGER trigger_update_recipe_display_image_on_steps
AFTER INSERT OR UPDATE OF image_url OR DELETE ON recipe_steps
FOR EACH ROW
EXECUTE FUNCTION update_recipe_display_image_on_steps_change();

-- 기존 레시피들의 display_image 초기화
-- (이미 있는 레시피들의 display_image를 계산)
UPDATE recipes
SET
  display_image = COALESCE(
    thumbnail_url,
    (
      SELECT image_url
      FROM recipe_steps
      WHERE recipe_steps.recipe_id = recipes.id AND image_url IS NOT NULL
      ORDER BY step_number DESC
      LIMIT 1
    ),
    ingredients_image_url
  );

COMMENT ON COLUMN recipes.display_image IS
'Automatically calculated display image for recipe cards. Priority: thumbnail_url → last step image → other step images → ingredients_image_url → null. Updated via triggers.';
