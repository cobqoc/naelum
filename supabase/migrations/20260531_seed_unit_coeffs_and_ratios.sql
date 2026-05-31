-- 단위 변환 계수 + 대체 비율 staple 시드 (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8-B.
--
-- 원칙(메모리 project_rda_nutrition_sync): 자동 sync 금지. 검증 소스에서 사람이 확인한
-- staple 값만 수동 시드. 확인 불가 값은 NULL 유지(CLAUDE.md 데이터 무결성).
-- 이름 기반 매칭(하드코딩 UUID 없음) — dev/prod 양쪽 portable·idempotent.
--
-- ⚠️ prod(main)에는 아직 V2 스키마 미적용 → 본 시드는 dev(develop) 대상.
--    V2 → prod 승격 시 base_id 마이그레이션·관계 그래프와 함께 적용.
--
-- ============================================================================
-- PART 1 — 단위 변환 계수 (ingredients_master.grams_per_ml / grams_per_count)
-- ============================================================================
-- 엔진: lib/units/quantity.ts UnitCoeffs. 차원 교차(부피↔무게·개수↔무게) 양 비교용.
-- 같은 차원/같은 단위는 계수 불필요 — 계수 없으면 해당 변환만 생략(degrade), 거짓 정확성 0.

-- 밀도(grams_per_ml) — 물리 상수(브랜드 무관 측정값). 부피(큰술·작은술·컵·ml)↔무게(g).
--   식용유·참기름·들기름: 식물성 식용유 밀도 ≈ 0.92 g/ml (상온, 표준 식품물리값)
--   우유: ≈ 1.03 g/ml / 식초: 5% 양조식초 ≈ 1.01 g/ml (≈물) / 꿀: ≈ 1.42 g/ml
UPDATE ingredients_master SET grams_per_ml = 0.92 WHERE name IN ('식용유', '참기름', '들기름') AND grams_per_ml IS NULL;
UPDATE ingredients_master SET grams_per_ml = 1.03 WHERE name = '우유' AND grams_per_ml IS NULL;
UPDATE ingredients_master SET grams_per_ml = 1.01 WHERE name = '식초' AND grams_per_ml IS NULL;
UPDATE ingredients_master SET grams_per_ml = 1.42 WHERE name = '꿀'   AND grams_per_ml IS NULL;

-- 개당 무게(grams_per_count) — 보편 표준만. 달걀: USDA 대란(large egg) 껍질 제외 ≈ 50 g (제빵 표준 기준값).
--   ⚠️ 양파·감자·당근 등 채소 개당 무게는 소/중/대 2~3배 편차 → 단일 값=추정이라 시드 안 함(NULL 유지).
--      향후 USDA FoodData portion(중간 크기 기준) 사람 검증 후 보강.
UPDATE ingredients_master SET grams_per_count = '{"개": 50}'::jsonb WHERE name = '달걀' AND grams_per_count IS NULL;

-- ============================================================================
-- PART 2 — 대체 비율 (ingredient_relations.ratio)
-- ============================================================================
-- ratio = (from 사용량)/(to 1단위). NULL = 1:1. 역방향은 trigger 미복사(NULL degrade) — 추측 0.
-- 현 카탈로그(70개) 내 검증된 표준 대체쌍은 당류뿐. 버터↔마가린·치즈 등은
-- 해당 재료가 카탈로그에 없어 미적용(8-A 사전 확장 후).

-- 꿀 → 설탕: 꿀이 설탕보다 달아 적게 — 표준 제빵 대체 "설탕 1 → 꿀 0.75".
--   (양방향 substitute. 행이 없으면 생성 + reverse trigger 자동. 있으면 ratio만 갱신.)
INSERT INTO ingredient_relations (from_id, to_id, kind, source, notes)
SELECT h.id, s.id, 'substitute', 'admin', '표준 제빵 대체(설탕↔꿀). 꿀이 더 달아 0.75'
FROM ingredients_master h, ingredients_master s
WHERE h.name = '꿀' AND s.name = '설탕'
ON CONFLICT (from_id, to_id, kind) DO NOTHING;

UPDATE ingredient_relations SET ratio = 0.75
WHERE kind = 'substitute'
  AND from_id = (SELECT id FROM ingredients_master WHERE name = '꿀')
  AND to_id   = (SELECT id FROM ingredients_master WHERE name = '설탕');
