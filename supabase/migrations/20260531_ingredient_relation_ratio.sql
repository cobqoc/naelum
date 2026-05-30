-- 대체 비율 — ingredient_relations.ratio (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8 Phase 3.
--
-- substitute 관계에서 양 조정. ratio = (from 사용량) / (to 1단위).
-- 예: 설탕(to) 대신 꿀(from), 꿀이 더 달아 0.75 → 레시피 "설탕 100g" → "꿀 75g".
-- NULL = 1:1 (조정 없음). 같은 단위일 때만 표시(계수 없으면 단위교차는 생략).
--
-- 양방향 reverse 트리거는 ratio 를 복사하지 않음 → 역방향 자동 row 는 NULL(=1:1) degrade.
-- 역방향 비율이 필요하면 어드민이 그 방향에 직접 설정(역수 자동 추정 안 함 — 추측 0).
-- additive·degrade-safe: NULL 기본 = 기존 동작.

ALTER TABLE ingredient_relations
  ADD COLUMN IF NOT EXISTS ratio numeric;

COMMENT ON COLUMN ingredient_relations.ratio IS
  '대체 비율 = (from 사용량)/(to 1단위). NULL=1:1. 예 설탕→꿀 0.75. 역방향 trigger 미복사(NULL degrade).';
