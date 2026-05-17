-- shopping_list_items에 ingredient_id 추가
-- 목적: ingredients_master JOIN으로 emoji를 DB에서 가져오기 (정적 파일 제거 사전 작업)
ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES ingredients_master(id) ON DELETE SET NULL;

-- 기존 행 백필: ingredient_name으로 ingredients_master 정확 일치 조회
UPDATE shopping_list_items si
SET ingredient_id = im.id
FROM ingredients_master im
WHERE si.ingredient_name = im.name
  AND si.ingredient_id IS NULL;
