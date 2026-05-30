-- 어드민 "재료 번호 연결" 큐 — published 레시피로 한정 (2026-05-30)
--
-- 왜:
--   매칭(번호 연결)은 오직 검색·추천을 위해서고, 검색·추천은 published 레시피만 쓴다.
--   비공개(정부 데이터 등) 레시피는 매칭해봤자 아무 데도 안 쓰임 → 큐만 오염.
--   prod 기준 미연결 15,847행 중 15,762행(99.5%)이 비공개. 공개 레시피 고유 이름은 52개뿐.
--   "멸치육수"처럼 비-재료 합성표현은 전부 비공개 레시피에서 옴.
--
-- 정책:
--   큐에 뜨는 *이름* = 공개 레시피에 1번이라도 등장하는 미연결 이름.
--   row_count(영향 행) = 그 이름의 *전체* 미연결 행 수 — 연결 시 공개/비공개 가리지 않고
--   그 이름의 모든 행에 번호가 붙으므로(linkRows), 실제 영향 규모를 정직하게 표시한다.
--
-- 레시피 데이터는 0 손상 — 큐 집계 범위만 좁힌다. 비공개 레시피를 나중에 공개하면
-- 그 재료가 자동으로 큐에 다시 들어온다 (올바른 동작).

-- ----------------------------------------------------------------------------
-- 1. 미연결 재료 목록 (공개 레시피에 등장하는 이름만) + 이름 정확일치 제안
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_unresolved_ingredients(
  p_limit  int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  ingredient_name     text,
  row_count           bigint,
  suggested_id        uuid,
  suggested_category  text,
  match_count         bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH published_names AS (
    -- 공개 레시피에 1번이라도 등장하는 미연결 이름
    SELECT DISTINCT ri.ingredient_name AS nm
    FROM recipe_ingredients ri
    JOIN recipes r ON r.id = ri.recipe_id AND r.status = 'published'
    WHERE ri.ingredient_id IS NULL
      AND ri.ingredient_name IS NOT NULL
      AND btrim(ri.ingredient_name) <> ''
  ),
  unlinked AS (
    -- 그 이름들의 *전체* 미연결 행 수 (공개/비공개 합산 — 연결 시 모두 번호 붙음)
    SELECT ri.ingredient_name AS nm, count(*) AS cnt
    FROM recipe_ingredients ri
    WHERE ri.ingredient_id IS NULL
      AND ri.ingredient_name IS NOT NULL
      AND btrim(ri.ingredient_name) <> ''
      AND ri.ingredient_name IN (SELECT nm FROM published_names)
    GROUP BY ri.ingredient_name
  ),
  matched AS (
    SELECT u.nm,
           u.cnt,
           count(m.id)                                  AS mcount,
           (array_agg(m.id ORDER BY m.id))[1]           AS sid,
           (array_agg(m.category ORDER BY m.id))[1]     AS scat
    FROM unlinked u
    LEFT JOIN ingredients_master m
      ON m.name = u.nm AND m.status = 'approved'
    GROUP BY u.nm, u.cnt
  )
  SELECT mt.nm                                                       AS ingredient_name,
         mt.cnt                                                      AS row_count,
         CASE WHEN mt.mcount = 1 THEN mt.sid  ELSE NULL END          AS suggested_id,
         CASE WHEN mt.mcount = 1 THEN mt.scat ELSE NULL END          AS suggested_category,
         mt.mcount                                                   AS match_count
  FROM matched mt
  ORDER BY mt.cnt DESC, mt.nm
  LIMIT  GREATEST(p_limit, 0)
  OFFSET GREATEST(p_offset, 0);
$$;

-- ----------------------------------------------------------------------------
-- 2. 요약 — 공개 레시피 기준 고유 이름 수 + 그 이름들의 총 미연결 행 수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_unresolved_ingredients_summary()
RETURNS TABLE (distinct_names bigint, total_rows bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH published_names AS (
    SELECT DISTINCT ri.ingredient_name AS nm
    FROM recipe_ingredients ri
    JOIN recipes r ON r.id = ri.recipe_id AND r.status = 'published'
    WHERE ri.ingredient_id IS NULL
      AND ri.ingredient_name IS NOT NULL
      AND btrim(ri.ingredient_name) <> ''
  )
  SELECT (SELECT count(*) FROM published_names)                      AS distinct_names,
         count(*)                                                    AS total_rows
  FROM recipe_ingredients ri
  WHERE ri.ingredient_id IS NULL
    AND ri.ingredient_name IS NOT NULL
    AND btrim(ri.ingredient_name) <> ''
    AND ri.ingredient_name IN (SELECT nm FROM published_names);
$$;

-- 권한 재확인 (CREATE OR REPLACE 는 권한 보존하지만 명시)
REVOKE ALL ON FUNCTION admin_unresolved_ingredients(int, int)     FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_unresolved_ingredients_summary()     FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_unresolved_ingredients(int, int)  TO service_role;
GRANT EXECUTE ON FUNCTION admin_unresolved_ingredients_summary()  TO service_role;
