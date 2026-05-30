-- recipe_ingredients.ingredient_id 백필 — 결정적 매칭만 (추측 0)
--
-- 배경: V2 매칭(lib/recommendations/matchV2.ts)은 ingredient_id 기반인데
-- 공공데이터 임포트·사전 리셋(1,653→66) 잔재로 recipe_ingredients.ingredient_id 가
-- 거의 전부 NULL → 재료 기반 추천이 0개 반환. 사전(ingredients_master)은 변경하지 않고
-- *이미 존재하는* 승인 마스터의 id 를 빈 칸에 채운다(코드: resolveExactIngredientIds).
--
-- 멱등: ingredient_id IS NULL 행만 갱신. 재실행/재환경 적용 안전.
-- 우선순위 = 정확 이름 → 큐레이션 별칭(aliases) → 공백 무시 (각 pass 는 직전까지 안 채워진 행만).
-- 접두사 분리·단어 쪼개기 같은 fuzzy 매칭은 하지 않는다(틀린 연결 방지).

-- pass A: 정확 이름 일치
UPDATE recipe_ingredients ri
SET ingredient_id = m.id
FROM ingredients_master m
WHERE ri.ingredient_id IS NULL
  AND m.status = 'approved'
  AND m.name = ri.ingredient_name;

-- pass B: 큐레이션 별칭 일치 (예: 통마늘→마늘, 후춧가루→후추 — 사람이 등록한 동의어)
UPDATE recipe_ingredients ri
SET ingredient_id = m.id
FROM ingredients_master m
WHERE ri.ingredient_id IS NULL
  AND m.status = 'approved'
  AND ri.ingredient_name = ANY(m.aliases);

-- pass C: 공백 무시 정확 일치 (예: "다진 마늘" → "다진마늘"; "마늘" 로 오연결되지 않음)
UPDATE recipe_ingredients ri
SET ingredient_id = m.id
FROM ingredients_master m
WHERE ri.ingredient_id IS NULL
  AND m.status = 'approved'
  AND replace(m.name, ' ', '') <> ''
  AND replace(m.name, ' ', '') = replace(btrim(ri.ingredient_name), ' ', '');
