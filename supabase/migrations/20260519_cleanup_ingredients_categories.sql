-- 재료 마스터 카테고리 통합 (2026-05-19)
-- UI 탭에 없는 카테고리(egg/nut/bakery/soy/asian/dessert/null) → 표준 카테고리로 통합

BEGIN;

-- ──────────────────────────────────────────────
-- 1. egg → dairy (계란류)
-- ──────────────────────────────────────────────
UPDATE ingredients_master
SET category = 'dairy', updated_at = NOW()
WHERE status = 'approved' AND category = 'egg';

-- ──────────────────────────────────────────────
-- 2. nut → grain (견과류)
-- ──────────────────────────────────────────────
UPDATE ingredients_master
SET category = 'grain', updated_at = NOW()
WHERE status = 'approved' AND category = 'nut';

-- ──────────────────────────────────────────────
-- 3. bakery → grain (빵류)
-- ──────────────────────────────────────────────
UPDATE ingredients_master
SET category = 'grain', updated_at = NOW()
WHERE status = 'approved' AND category = 'bakery';

-- ──────────────────────────────────────────────
-- 4. soy → grain (두부·콩 제품)
-- ──────────────────────────────────────────────
UPDATE ingredients_master
SET category = 'grain', updated_at = NOW()
WHERE status = 'approved' AND category = 'soy';

-- ──────────────────────────────────────────────
-- 5. dessert → snack (디저트 전체)
-- ──────────────────────────────────────────────
UPDATE ingredients_master
SET category = 'snack', updated_at = NOW()
WHERE status = 'approved' AND category = 'dessert';

-- ──────────────────────────────────────────────
-- 6. asian 카테고리 분리
-- ──────────────────────────────────────────────

-- 요리 자체 → pending (재료가 아님)
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved' AND category = 'asian'
  AND name IN ('된장국', '볶음밥', '불고기', '비빔밥', '초밥', '팟타이');

-- 발효 식품 → seasoning
UPDATE ingredients_master
SET category = 'seasoning', updated_at = NOW()
WHERE status = 'approved' AND category = 'asian'
  AND name IN ('김치', '배추김치', '카레');

-- 면류 → grain
UPDATE ingredients_master
SET category = 'grain', updated_at = NOW()
WHERE status = 'approved' AND category = 'asian'
  AND name IN ('라면', '쌀국수', '우동');

-- 간식류 → snack
UPDATE ingredients_master
SET category = 'snack', updated_at = NOW()
WHERE status = 'approved' AND category = 'asian'
  AND name IN ('만두', '스프링롤', '튀김');

-- ──────────────────────────────────────────────
-- 7. NULL 카테고리 개별 분류
-- ──────────────────────────────────────────────

UPDATE ingredients_master
SET category = 'veggie', updated_at = NOW()
WHERE status = 'approved' AND category IS NULL
  AND name IN ('머위', '차조기 잎(시소)');

UPDATE ingredients_master
SET category = 'seafood', updated_at = NOW()
WHERE status = 'approved' AND category IS NULL
  AND name IN ('은어', '전갱이', '청어');

UPDATE ingredients_master
SET category = 'grain', updated_at = NOW()
WHERE status = 'approved' AND category IS NULL
  AND name IN ('고야 두부(건조 두부)', '메밀', '비지');

COMMIT;
