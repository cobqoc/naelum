-- recipes 테이블에 sodium_mg 컬럼 추가
-- 나트륨 함량 (밀리그램 단위)

ALTER TABLE recipes
ADD COLUMN sodium_mg INTEGER;

-- 컬럼 설명 추가
COMMENT ON COLUMN recipes.sodium_mg IS
'나트륨 함량 (mg 단위, 1인분 기준). 선택사항. WHO 권장 섭취량: 2000mg 미만/일';

-- 검색 성능 최적화를 위한 인덱스 생성 (선택사항)
-- CREATE INDEX idx_recipes_sodium ON recipes(sodium_mg) WHERE sodium_mg IS NOT NULL;
