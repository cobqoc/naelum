-- 재료 보관기간(shelf-life) — 요리 도감 상세 표시 + 냉장고 신선도 추정(tier②) 공용.
-- 재료의 또 하나의 기준 속성이라 별도 테이블이 아닌 ingredients_master 한 곳에 둠
-- (storage_tips·seasons·nutrition 과 동일 층위). 출처는 기존 data_source/attribution 재사용.
--
-- 보관위치 키의 일수 맵. 예: {"냉장": 7, "냉동": 180, "상온": 5}
-- - 키는 user_ingredients.storage_location 과 동일 어휘('냉장'·'냉동'·'상온')
-- - 값 하나/(재료,보관위치) 카디널리티 → jsonb 가 storage 동적 룩업(->>)에 최적
-- - null 이면 신선도 resolver 가 카테고리 fallback(코드)으로 떨어짐 → 독립 채움 가능
-- - ⚠️ 데이터 무결성: FoodKeeper(미 공공도메인)·식약처 등 출처 확인값만. 추정·날조 금지.
ALTER TABLE ingredients_master
  ADD COLUMN IF NOT EXISTS shelf_life_days jsonb;

COMMENT ON COLUMN ingredients_master.shelf_life_days IS
  '보관위치별 권장 보관일수 {"냉장":n,"냉동":n,"상온":n}. 출처 확인값만(data_source/attribution 참조).';
