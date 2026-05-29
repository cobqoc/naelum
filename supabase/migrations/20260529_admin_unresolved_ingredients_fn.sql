-- 어드민 "재료 번호 연결" — 미연결 레시피 재료 집계 RPC (2026-05-29)
--
-- 왜 RPC 인가:
--   recipe_ingredients 미연결 행이 prod 15,829개. PostgREST .select() 는 1000행 silent 제한이라
--   JS 집계 불가 (CLAUDE.md 규칙). GROUP BY + 마스터 join 은 DB 에서 처리해야 정확.
--
-- 호출: service-role 클라이언트로만 (api/admin/ingredient-matching). authenticated/anon 은 execute 박탈.
-- SECURITY DEFINER: 모든 레시피 가로질러 집계 (어드민은 행위자≠소유자, RLS 우회 필요).

-- ----------------------------------------------------------------------------
-- 1. 미연결 재료 목록 (빈도순) + 이름 정확일치 제안
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
  WITH unlinked AS (
    SELECT ri.ingredient_name AS nm, count(*) AS cnt
    FROM recipe_ingredients ri
    WHERE ri.ingredient_id IS NULL
      AND ri.ingredient_name IS NOT NULL
      AND btrim(ri.ingredient_name) <> ''
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
-- 2. 요약 — 미연결 고유 이름 수 + 총 행 수 (진척 표시용)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_unresolved_ingredients_summary()
RETURNS TABLE (distinct_names bigint, total_rows bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(DISTINCT ri.ingredient_name) AS distinct_names,
         count(*)                           AS total_rows
  FROM recipe_ingredients ri
  WHERE ri.ingredient_id IS NULL
    AND ri.ingredient_name IS NOT NULL
    AND btrim(ri.ingredient_name) <> '';
$$;

-- 권한: PUBLIC(=anon/authenticated) execute 박탈, service_role 만 호출 가능
REVOKE ALL ON FUNCTION admin_unresolved_ingredients(int, int)     FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_unresolved_ingredients_summary()     FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_unresolved_ingredients(int, int)  TO service_role;
GRANT EXECUTE ON FUNCTION admin_unresolved_ingredients_summary()  TO service_role;
