-- 채소 개당 무게 계수 시드 — 한국 기준 (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8-B. 엔진: lib/units/quantity.ts (grams_per_count).
--
-- 출처: KAMIS(농수산식품유통정보, aT) 농산물 표준규격 — 채소 개당 무게.
--   https://www.kamis.or.kr/customer/price/knowhow/knowhow.do?action=standardList
-- 값 = '중품(中)' 등급 무게범위의 중앙값(매칭용 대표값). 숫자=공식 범위에서 투명 도출(추측 0).
-- ⚠️ 한국 채소 기준 — 무(1.45kg)·배추(2kg)는 미국 동명 품목과 전혀 다름(USDA 적용 불가).
--
-- 미수록: 양파·대파·마늘 — KAMIS가 무게가 아닌 지름/직경(cm)으로만 규정 → 보조 출처(농진청·식약처) 확인 후 별도 추가.
-- additive·재실행 안전: grams_per_count 비어있을 때만 SET.

UPDATE ingredients_master SET grams_per_count = '{"개": 1450}'::jsonb WHERE name = '무'    AND grams_per_count IS NULL; -- 중품 1.0~1.9kg
UPDATE ingredients_master SET grams_per_count = '{"개": 150}'::jsonb  WHERE name = '당근'  AND grams_per_count IS NULL; -- 중품 100~200g
UPDATE ingredients_master SET grams_per_count = '{"개": 130}'::jsonb  WHERE name = '감자'  AND grams_per_count IS NULL; -- 중품 100~160g
UPDATE ingredients_master SET grams_per_count = '{"개": 200}'::jsonb  WHERE name = '오이'  AND grams_per_count IS NULL; -- 취청 중품 180~220g
UPDATE ingredients_master SET grams_per_count = '{"개": 350}'::jsonb  WHERE name = '애호박' AND grams_per_count IS NULL; -- 중품 350g 내외
UPDATE ingredients_master SET grams_per_count = '{"개": 75}'::jsonb   WHERE name = '피망'  AND grams_per_count IS NULL; -- 중품 50~100g
UPDATE ingredients_master SET grams_per_count = '{"포기": 2000}'::jsonb WHERE name = '배추'  AND grams_per_count IS NULL; -- 중품 1.5~2.5kg
UPDATE ingredients_master SET grams_per_count = '{"통": 2500}'::jsonb  WHERE name = '양배추' AND grams_per_count IS NULL; -- 중품 2.0~3.0kg

-- 보조 출처: 목측량(눈대중량) — KAMIS가 무게 아닌 지름/직경으로만 규정한 품목.
--   영양교육 표준 눈대중량. 양파 중(지름 8cm) 1개≈200g(KAMIS 중품 지름 6~8cm과 정합), 마늘 1쪽≈5g.
--   ⚠️ 대파는 보류 — 공식 자료가 '자른 흰부분' 분량(25g/큰술) 위주라 '1대 전체' 무게 신뢰값 없음 → NULL.
UPDATE ingredients_master SET grams_per_count = '{"개": 200}'::jsonb WHERE name = '양파' AND grams_per_count IS NULL;
UPDATE ingredients_master SET grams_per_count = '{"쪽": 5}'::jsonb   WHERE name = '마늘' AND grams_per_count IS NULL;

-- 제외(미시드): 사과·오렌지·바나나·두부 — 교차검증 시 출처 간 값 충돌/발산(사과 200~330·두부 300~450)
--   또는 한국 1차출처 미확보. 개당무게는 본질적으로 분포라 단일 신뢰값 없음 → NULL 유지(추측 0).
-- 제외(미시드): 대파 — 공식자료가 '자른 흰부분 분량' 위주, 1대 전체 무게 합의 없음(100~300g).
