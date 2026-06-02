-- 죽은 레거시 정리 (2026-06-03 read-only 감사 후).
--
-- 전수 호환 검사 통과:
--  · app 런타임 .from() 참조 0회 (정밀 grep)
--  · 이 테이블들을 가리키는 incoming FK 0 (LIVE 테이블 영향 없음)
--  · 테이블에 붙은 트리거 0, 함수 2개는 트리거 미부착 고아(죽은 댓글 시스템)
--  · 뷰 popular_recipes/recipe_popularity 코드 미사용
--  · **dev 가 이 테이블들 없이 전체 e2e 통과 = 앱 불필요 증거** (스키마 drift: dev엔 이미 없음)
--
-- 데이터(cooking_tips 8 · cooked_records 2 · saved_recipes 1 = 옛 테스트 유저 seed)는
--   docs/db/legacy-tables-backup-20260603.json 에 백업(되돌리기용).
--
-- 대체(현행) 매핑:
--   comments → recipe_posts(통합 피드) | saved_recipes → recipe_saves | cooking_tips → tip
--   cooked_records → cooking_sessions/recipe_posts | fridge_items → user_ingredients
--   shopping_items → shopping_list_items | ingredient_substitutes_global → ingredient_relations(V2)
--
-- IF EXISTS 로 멱등 — dev(대부분 없음)·prod(누적분) 양쪽 안전.
-- ⚠️ refresh_recipe_post_counts(현행 통합 피드용)는 절대 건드리지 않음.

BEGIN;

DROP VIEW IF EXISTS public.popular_recipes;
DROP VIEW IF EXISTS public.recipe_popularity;

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.saved_recipes CASCADE;
DROP TABLE IF EXISTS public.cooking_tips CASCADE;
DROP TABLE IF EXISTS public.cooked_records CASCADE;
DROP TABLE IF EXISTS public.fridge_items CASCADE;
DROP TABLE IF EXISTS public.shopping_items CASCADE;
DROP TABLE IF EXISTS public.ingredient_substitutes_global CASCADE;

-- 고아 함수 (죽은 댓글 카운트 트리거 함수 — 트리거 미부착)
DROP FUNCTION IF EXISTS public.update_comment_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_recipe_comments_count() CASCADE;

COMMIT;
