-- 육류 부위·가공형 재료 추가 — 8-A 사전 확장 (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8-A. 기존 base(돼지고기·소고기·닭고기) 위에 부위 변형 추가.
--
-- 분류 사실만(추측 0): "삼겹살은 돼지고기다"는 사실 → base_ingredient_id(변형).
--   변형 보유 → base 필요 충족(단방향). 형제 부위끼리 자동 대체는 안 함(정직성).
-- 다진고기 = 부위 아니라 가공형 → 다진마늘 선례와 동일하게 preparable_to(단방향). base_id 아님.
--   base→가공 보유 충족(소고기 보유 → 다진소고기 필요 OK), 역방향 미충족.
--
-- 이름 충돌(등심·안심은 돼지·소 공통) → 돼지등심/소등심 식으로 구분. allergens 는
--   부위=base 상속(NULL), 다진고기=base_id 없어 직접 설정.
-- additive·재실행 안전: NOT EXISTS(name) 가드 + ON CONFLICT DO NOTHING.
-- ⚠️ prod(main)에 V2 스키마 미적용 → dev 대상.

-- ============================================================================
-- 1. 부위 변형 (base_ingredient_id) — 18종
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases, base_ingredient_id)
SELECT v.name, v.name, 'meat', 'approved', 'admin', false, v.emoji, v.aliases, b.id
FROM (VALUES
  -- 돼지고기 부위
  ('대패삼겹살', '🥩', ARRAY['thinly sliced pork belly']::text[], '돼지고기'),
  ('앞다리살',   '🥩', ARRAY['전지','pork shoulder']::text[],      '돼지고기'),
  ('뒷다리살',   '🥩', ARRAY['후지','pork leg']::text[],           '돼지고기'),
  ('돼지등심',   '🥩', ARRAY['pork loin']::text[],                 '돼지고기'),
  ('돼지안심',   '🥩', ARRAY['pork tenderloin']::text[],           '돼지고기'),
  ('돼지갈비',   '🥩', ARRAY['pork ribs']::text[],                 '돼지고기'),
  ('항정살',     '🥩', ARRAY['pork jowl']::text[],                 '돼지고기'),
  -- 소고기 부위
  ('소등심',     '🥩', ARRAY['beef sirloin']::text[],              '소고기'),
  ('소안심',     '🥩', ARRAY['beef tenderloin']::text[],           '소고기'),
  ('채끝',       '🥩', ARRAY['채끝등심','striploin']::text[],      '소고기'),
  ('양지',       '🥩', ARRAY['양지머리','brisket']::text[],        '소고기'),
  ('우둔',       '🥩', ARRAY['우둔살','beef round']::text[],       '소고기'),
  ('소갈비',     '🥩', ARRAY['beef ribs','beef short ribs']::text[], '소고기'),
  -- 닭고기 부위
  ('닭가슴살',   '🍗', ARRAY['chicken breast']::text[],            '닭고기'),
  ('닭다리살',   '🍗', ARRAY['닭다리','chicken thigh','chicken drumstick']::text[], '닭고기'),
  ('닭안심',     '🍗', ARRAY['chicken tenderloin']::text[],        '닭고기'),
  ('닭날개',     '🍗', ARRAY['chicken wing']::text[],              '닭고기'),
  ('닭봉',       '🍗', ARRAY['chicken drumette']::text[],          '닭고기')
) AS v(name, emoji, aliases, base_name)
JOIN ingredients_master b ON b.name = v.base_name
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);

-- ============================================================================
-- 2. 다진고기 (가공형) — 2종. base_id 아님(다진마늘 선례). allergens 직접.
-- ============================================================================
INSERT INTO ingredients_master (name, name_ko, category, status, data_source, is_processed, emoji, aliases, allergens)
SELECT v.name, v.name, 'meat', 'approved', 'admin', true, '🥩', v.aliases, v.allergens
FROM (VALUES
  ('다진소고기',   ARRAY['ground beef','minced beef','소고기다짐육']::text[],   ARRAY['쇠고기']::text[]),
  ('다진돼지고기', ARRAY['ground pork','minced pork','돼지고기다짐육']::text[], ARRAY['돼지고기']::text[])
) AS v(name, aliases, allergens)
WHERE NOT EXISTS (SELECT 1 FROM ingredients_master x WHERE x.name = v.name);

-- 3. 가공 관계 — base → 다진 (단방향). 소고기 보유 → 다진소고기 필요 충족.
INSERT INTO ingredient_relations (from_id, to_id, kind, source)
SELECT f.id, t.id, 'preparable_to', 'admin'
FROM ingredients_master f, ingredients_master t
WHERE (f.name, t.name) IN (VALUES ('소고기','다진소고기'), ('돼지고기','다진돼지고기'))
ON CONFLICT (from_id, to_id, kind) DO NOTHING;
