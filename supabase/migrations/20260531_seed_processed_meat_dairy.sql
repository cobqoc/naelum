-- 한식·양식 필수 재료 2순위 추가 — 가공육·유제품 (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8-A 사전 확장 2순위. 메모리 project_ingredient_category_taxonomy.
--
-- 신규 카테고리 없음 — processed(가공식품)·dairy·oil 기존 카테고리만 사용(코드 배선 불필요).
-- 알레르겐 어휘는 기존 데이터에 맞춤: 돼지고기는 '돼지고기', 유제품은 '우유'.
--
-- 가공육(베이컨·소시지·햄·스팸): processed(가공식품). "고기 한 부위"가 아니라 전분·물·결착제가 섞인
--   재구성 복합물이라 meat가 아닌 processed가 본질. base_id 아님(standalone, 생돼지고기로 대체 불가).
--   allergens=['돼지고기'] 직접 — 카테고리와 무관. 알레르기 안전은 과경고가 안전한 방향이라(누락이 위험)
--   소시지 포함 4종 모두 돼지로 태그. (단, 결착제 대두·밀 등은 제품마다 달라 미기재 — 라벨 확인 영역.)
--   ※ 다진소고기/다진돼지고기는 순수 분쇄육(복합물 아님)이라 meat 유지 — 별 시드(seed_meat_cuts).
-- 치즈: base 치즈(dairy, 우유) ← 모짜렐라·체다·슬라이스치즈 변형(base_ingredient_id). allergens는 base 상속(NULL).
-- 버터=dairy 단일(유지 아님 — 우유 알레르겐 tiebreaker, 메모리 결정). 생크림=dairy. 마가린=oil(식물유지, 우유 없음).
-- 대체쌍: 버터↔마가린만(진짜 1:1). 양방향 명시 저장(설탕↔백설탕 선례). ratio NULL=1:1.
--   ⚠️ 생크림↔우유는 제외 — 유지방 달라 깨끗한 1:1 대체 아님(정직성, 신뢰 > 매칭 풍부함).
-- additive·재실행 안전: NOT EXISTS(name) 가드 + ON CONFLICT DO NOTHING.
-- ⚠️ prod(main)에 V2 스키마 미적용 → dev 대상.

-- ============================================================================
-- 1. 가공육 (processed 가공식품, is_processed) — 4종. allergens=['돼지고기'] 직접. base/관계 없음.
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases, allergens)
SELECT v.name, v.name, 'processed', 'approved', 'admin', true, v.emoji, v.aliases, ARRAY['돼지고기']::text[]
FROM (VALUES
  ('베이컨', '🥓', ARRAY['bacon']::text[]),
  ('소시지', '🌭', ARRAY['sausage','비엔나','비엔나소시지']::text[]),
  ('햄',     '🍖', ARRAY['ham']::text[]),
  ('스팸',   '🥫', ARRAY['spam','런천미트','luncheon meat']::text[])
) AS v(name, emoji, aliases)
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);

-- ============================================================================
-- 2. 치즈 base (dairy, 우유) — 변형이 FK 참조하므로 먼저
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases, allergens)
SELECT '치즈', '치즈', 'dairy', 'approved', 'admin', true, '🧀', ARRAY['cheese']::text[], ARRAY['우유']::text[]
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = '치즈');

-- 3. 치즈 변형 (base_ingredient_id → 치즈). allergens는 base 상속(NULL).
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases, base_ingredient_id)
SELECT v.name, v.name, 'dairy', 'approved', 'admin', true, '🧀', v.aliases, b.id
FROM (VALUES
  ('모짜렐라',     ARRAY['모짜렐라치즈','모차렐라','mozzarella']::text[]),
  ('체다',         ARRAY['체다치즈','cheddar','cheddar cheese']::text[]),
  ('슬라이스치즈', ARRAY['슬라이스 치즈','sliced cheese']::text[])
) AS v(name, aliases)
JOIN ingredients_master b ON b.name = '치즈'
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);

-- ============================================================================
-- 4. 버터·생크림 (dairy, 우유) / 마가린 (oil, 우유 없음)
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases, allergens)
SELECT v.name, v.name, v.category, 'approved', 'admin', v.is_processed, v.emoji, v.aliases, v.allergens
FROM (VALUES
  ('버터',   'dairy', false, '🧈', ARRAY['butter']::text[],                              ARRAY['우유']::text[]),
  ('생크림', 'dairy', true,  '🥛', ARRAY['fresh cream','heavy cream','whipping cream']::text[], ARRAY['우유']::text[]),
  ('마가린', 'oil',   true,  '🧈', ARRAY['margarine']::text[],                           NULL::text[])
) AS v(name, category, is_processed, emoji, aliases, allergens)
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);

-- ============================================================================
-- 5. 대체쌍: 버터 ↔ 마가린 (진짜 1:1, 양방향 명시, ratio NULL)
-- ============================================================================
INSERT INTO ingredient_relations (from_id, to_id, kind, source)
SELECT f.id, t.id, 'substitute', 'admin'
FROM ingredients_master f, ingredients_master t
WHERE (f.name, t.name) IN (VALUES ('버터','마가린'), ('마가린','버터'))
ON CONFLICT (from_id, to_id, kind) DO NOTHING;
