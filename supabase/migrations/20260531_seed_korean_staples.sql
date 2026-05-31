-- 한식 필수 재료 1순위 추가 — 버섯류·해조류·김치 (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8-A 사전 확장 1순위. 메모리 project_ingredient_category_taxonomy.
--
-- 카테고리 본질 분류(추측 0):
--   · 버섯류(mushroom 신규) — 균류라 채소(veggie) 아님.
--   · 해조류(seaweed 신규)  — 어패류·채소 아닌 별도 식품군.
--   · 김치 = fermented(발효채소). 배추김치·깍두기·총각김치는 김치 base 변형(base_ingredient_id).
-- 버섯·해조류는 서로 변형 아님(표고≠느타리) → 개별 등록. 형제끼리 자동 대체 안 함(정직성).
-- allergens: 전부 NULL 유지 — 버섯·해조류 알레르겐 없음. 김치는 젓갈 유무가 제품마다 달라
--   미검증(비건 김치 존재) → 추측 안 함(데이터 무결성). base=NULL → 변형 상속도 NULL.
-- additive·재실행 안전: NOT EXISTS(name) 가드.
-- ⚠️ prod(main)에 V2 스키마 미적용 → dev 대상. mushroom·seaweed 카테고리 코드 배선 동반(별도 커밋).

-- ============================================================================
-- 1. 버섯류 (mushroom 신규 카테고리) — 5종, 개별 등록
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases)
SELECT v.name, v.name, 'mushroom', 'approved', 'admin', false, '🍄', v.aliases
FROM (VALUES
  ('표고버섯',   ARRAY['표고','shiitake','shiitake mushroom']::text[]),
  ('느타리버섯', ARRAY['느타리','oyster mushroom']::text[]),
  ('새송이버섯', ARRAY['새송이','king oyster mushroom','king trumpet mushroom']::text[]),
  ('팽이버섯',   ARRAY['팽이','enoki','enoki mushroom']::text[]),
  ('양송이버섯', ARRAY['양송이','button mushroom','white mushroom']::text[])
) AS v(name, aliases)
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);

-- ============================================================================
-- 2. 해조류 (seaweed 신규 카테고리) — 3종, 개별 등록
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases)
SELECT v.name, v.name, 'seaweed', 'approved', 'admin', false, '🌿', v.aliases
FROM (VALUES
  ('김',     ARRAY['gim','laver','nori','조미김']::text[]),
  ('미역',   ARRAY['miyeok','sea mustard','wakame']::text[]),
  ('다시마', ARRAY['dasima','kelp','kombu']::text[])
) AS v(name, aliases)
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);

-- ============================================================================
-- 3. 김치 base (fermented) — 먼저 등록(변형이 FK 참조)
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases)
SELECT '김치', '김치', 'fermented', 'approved', 'admin', false, '🥬', ARRAY['kimchi']::text[]
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = '김치');

-- 4. 김치 변형 (base_ingredient_id → 김치). 변형 보유 → 김치 필요 충족(단방향).
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases, base_ingredient_id)
SELECT v.name, v.name, 'fermented', 'approved', 'admin', false, '🥬', v.aliases, b.id
FROM (VALUES
  ('배추김치', ARRAY['napa cabbage kimchi','baechu kimchi']::text[]),
  ('깍두기',   ARRAY['kkakdugi','radish kimchi']::text[]),
  ('총각김치', ARRAY['chonggak kimchi','ponytail radish kimchi']::text[])
) AS v(name, aliases)
JOIN ingredients_master b ON b.name = '김치'
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);
