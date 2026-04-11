-- recipes 테이블에 dish_type 컬럼 추가
-- 요리 유형 분류를 위한 2단계 분류 시스템 (cuisine_type + dish_type)
-- 예: 한식(cuisine_type) + 국&찌개(dish_type)

ALTER TABLE recipes
ADD COLUMN dish_type TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN recipes.dish_type IS
'요리 유형 분류 (선택사항). 가능한 값: main, soup, side, noodle, rice, dessert, beverage, snack, other. cuisine_type과 함께 2단계 분류 시스템을 구성하여 더 세밀한 검색과 필터링을 제공함.';

-- 검색 성능 최적화를 위한 인덱스 생성
CREATE INDEX idx_recipes_dish_type ON recipes(dish_type) WHERE dish_type IS NOT NULL;

-- cuisine_type과 dish_type 조합 검색을 위한 복합 인덱스
CREATE INDEX idx_recipes_cuisine_dish_type ON recipes(cuisine_type, dish_type) WHERE dish_type IS NOT NULL;
