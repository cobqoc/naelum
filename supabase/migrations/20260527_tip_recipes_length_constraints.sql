-- 2026-05-27: tip·recipes 제목·설명 길이 제약 + 의존 객체 보존 재생성
--
-- 배경: 제목·설명 모두 무제한 TEXT/VARCHAR → 악의적 거대 텍스트 저장 가능.
-- FE 측 maxLength 도 일부만 적용된 *부분 방어*. DB·API·FE 3중 방어로 통일.
--
-- 한도 결정 근거 (사용자 데이터 분석 결과):
--  - tip (prod 10행): max title 29자, max description 157자
--  - recipes (prod): max title 25자, max description 137자 (avg 34자)
--  → 500자 한도는 *현재 사용 패턴의 3배 여유*. 기존 데이터 영향 0
--
-- 의존 객체 처리 (모두 byte-identical 재생성):
--  1. popular_recipes 뷰 — recipes.title, description, search_vector 참조
--  2. recipe_popularity 뷰 — recipes.title 참조
--  3. recipes.search_vector generated column — title(weight A) + description(weight B) tsvector
--
-- 부수 이득: dev DB 의 누락된 `security_invoker = true` 옵션도 prod 와 동기화 (2026-04-26 보안 강화 옵션 복구)
--
-- 안전성:
--  - 트랜잭션 atomic (Supabase MCP 자동 적용)
--  - 뷰 정의 pg_get_viewdef·migration 파일 양쪽 캡처
--  - generated column expression PostgreSQL 표준 SQL 보존
--  - 인덱스·check constraint·트리거 함수 영향 0 (전수 감사 완료)
--  - 데이터 길이 3배 여유 → 마이그레이션 실패 없음

-- ============================================================
-- 1단계: 의존 객체 drop (역순)
-- ============================================================

DROP VIEW IF EXISTS public.popular_recipes;
DROP VIEW IF EXISTS public.recipe_popularity;
ALTER TABLE public.recipes DROP COLUMN IF EXISTS search_vector;

-- ============================================================
-- 2단계: 컬럼 타입 변경 (4 컬럼)
-- ============================================================

ALTER TABLE public.tip ALTER COLUMN title TYPE VARCHAR(200);
ALTER TABLE public.tip ALTER COLUMN description TYPE VARCHAR(500);
ALTER TABLE public.recipes ALTER COLUMN title TYPE VARCHAR(200);
ALTER TABLE public.recipes ALTER COLUMN description TYPE VARCHAR(500);

-- ============================================================
-- 3단계: generated column 재생성 (정의 byte-identical)
-- ============================================================

ALTER TABLE public.recipes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english'::regconfig, COALESCE(title::text, ''::text)), 'A'::"char") ||
    setweight(to_tsvector('english'::regconfig, COALESCE(description, ''::text)), 'B'::"char")
  ) STORED;

-- ============================================================
-- 4단계: 뷰 재생성 (정의 byte-identical + security_invoker=true 보존)
-- ============================================================

CREATE VIEW public.popular_recipes WITH (security_invoker = true) AS
 SELECT r.id,
    r.author_id,
    r.title,
    r.description,
    r.thumbnail_url,
    r.video_url,
    r.servings,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.total_time_minutes,
    r.difficulty_level,
    r.cuisine_type,
    r.dish_type,
    r.meal_type,
    r.calories,
    r.protein_grams,
    r.carbs_grams,
    r.fat_grams,
    r.fiber_grams,
    r.is_vegetarian,
    r.is_vegan,
    r.is_gluten_free,
    r.is_dairy_free,
    r.is_low_carb,
    r.views_count,
    r.likes_count,
    r.saves_count,
    r.comments_count,
    r.shares_count,
    r.average_rating,
    r.ratings_count,
    r.original_recipe_id,
    r.is_remix,
    r.is_featured,
    r.published_at,
    r.created_at,
    r.updated_at,
    r.search_vector,
    r.ingredients_image_url,
    r.display_image,
    r.sodium_mg,
    r.status,
    p.username AS author_username,
    p.avatar_url AS author_avatar
   FROM (recipes r
     JOIN profiles p ON ((r.author_id = p.id)))
  WHERE (r.status = 'published'::text)
  ORDER BY (((((r.likes_count * 2) + (r.saves_count * 3)))::numeric + ((r.views_count)::numeric * 0.1)) + (r.average_rating * (10)::numeric)) DESC;

CREATE VIEW public.recipe_popularity WITH (security_invoker = true) AS
 SELECT r.id,
    r.title,
    r.author_id,
    count(DISTINCT cs.user_id) FILTER (WHERE (cs.completed_at IS NOT NULL)) AS cooked_count,
    r.average_rating,
    r.ratings_count,
    r.saves_count,
    r.comments_count,
    r.views_count
   FROM (recipes r
     LEFT JOIN cooking_sessions cs ON ((r.id = cs.recipe_id)))
  GROUP BY r.id;

-- ============================================================
-- 5단계: 권한 명시 GRANT (Supabase 표준 4역할)
-- ============================================================

GRANT ALL ON public.popular_recipes TO anon, authenticated, service_role;
GRANT ALL ON public.recipe_popularity TO anon, authenticated, service_role;
