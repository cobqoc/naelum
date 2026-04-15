-- 성능 인덱스 보강 (2026-04-15)
-- 실측 EXPLAIN ANALYZE 결과 기반:
-- 1. recipes 트렌딩 쿼리: Seq Scan + Sort (1402 rows) → partial index로 정렬 단계 제거
-- 2. recipe_ingredients ilike 검색 (fridge recommendation): Seq Scan 20ms → trigram GIN으로 줄임
-- 3. tip is_public 쿼리: 데이터 작아 즉시 효과는 작지만 향후 확장 대비 composite index 추가

-- 1) 트렌딩 인기 레시피용 partial index
CREATE INDEX IF NOT EXISTS idx_recipes_published_views
  ON public.recipes (views_count DESC)
  WHERE status = 'published';

-- 2) 재료 ILIKE 검색용 trigram GIN
-- pg_trgm extension이 없으면 먼저 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name_trgm
  ON public.recipe_ingredients
  USING gin (ingredient_name gin_trgm_ops);

-- 3) 공개 팁 최신순 composite index
CREATE INDEX IF NOT EXISTS idx_tip_public_created
  ON public.tip (is_public, created_at DESC);
