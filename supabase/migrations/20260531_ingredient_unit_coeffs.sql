-- 단위 변환 계수 컬럼 — ingredients_master (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8 Phase 2 / §미해결 5.
--
-- 매칭 엔진 lib/units/quantity.ts 의 UnitCoeffs 인터페이스를 DB로 채운다.
--  - grams_per_ml: 밀도 (부피↔무게). 물1·기름~0.92·꿀~1.42. NULL=부피↔무게 변환 불가(degrade).
--  - grams_per_count: 개수단위→g 맵 jsonb. 예 {"개":200,"쪽":5}. NULL=개수↔무게 변환 불가(degrade).
--
-- §미해결 5 결정: 단위 종류가 (밀도 스칼라 + 개수맵) 으로 bounded → 별도 ingredient_units
-- 테이블 대신 컬럼 2개. join 없음·degrade-safe(NULL=계수 없음=기존 동작).
-- 자동 sync 금지(메모리 project_rda_nutrition_sync) — 검증 소스에서 수동 시드만(별도 시드 마이그레이션).
--
-- ⚠️ prod(main)에는 V2 스키마 미적용 → 본 컬럼도 dev(develop) 대상. V2 승격 시 함께 적용.

ALTER TABLE ingredients_master
  ADD COLUMN IF NOT EXISTS grams_per_ml numeric,
  ADD COLUMN IF NOT EXISTS grams_per_count jsonb;

COMMENT ON COLUMN ingredients_master.grams_per_ml IS
  '밀도 g/ml (부피↔무게 변환). NULL=변환 불가 degrade. 예 식용유 0.92·꿀 1.42. 검증소스 수동 시드.';
COMMENT ON COLUMN ingredients_master.grams_per_count IS
  '개수단위→g jsonb 맵 (개수↔무게 변환). 예 {"개":200,"쪽":5}. NULL=변환 불가 degrade. 검증소스 수동 시드.';
