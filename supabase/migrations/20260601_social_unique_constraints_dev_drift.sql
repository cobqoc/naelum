-- 소셜 테이블 UNIQUE 제약 dev↔prod 드리프트 복구 (AUDIT_2026-05-31 C5)
--
-- 배경: prod(naelum)에는 아래 6개 테이블에 "한 유저당 1행" UNIQUE 제약이 있으나
--       dev(naelum-dev)에는 전부 누락돼 있었다. dev 리셋 과정에서 유실된 것으로 추정.
--       그 결과:
--         1) dev 에서 SELECT-then-INSERT race 가 중복행을 만들 수 있음(prod는 23505로 거부)
--         2) e2e 가 dev 에서 green 이어도 prod 와 동작이 달라 회귀 테스트 신뢰성 붕괴
--       CLAUDE.md "dev/prod 동기화 완료" 기재와 실제가 어긋나 있었다.
--
-- 이 마이그레이션은 prod 제약과 *이름까지 동일*하게 dev 를 맞춘다.
-- 멱등(idempotent): 이미 존재하면 건너뛰므로 prod 에 적용해도 안전(전부 skip).
-- cooking_sessions 는 prod·dev 양쪽 모두 UNIQUE 가 없음 → 의도된 상태, 손대지 않음.
--
-- 사전 점검: dev 중복행 0건 확인 완료(2026-06-01). 신규 환경에서 중복이 있으면
-- ADD CONSTRAINT 가 실패하므로, 그 경우 먼저 중복 정리 후 재실행할 것.

DO $$
BEGIN
  -- recipe_saves (recipe_id, user_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_saves_recipe_id_user_id_key') THEN
    ALTER TABLE public.recipe_saves
      ADD CONSTRAINT recipe_saves_recipe_id_user_id_key UNIQUE (recipe_id, user_id);
  END IF;

  -- recipe_likes (recipe_id, user_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_likes_recipe_id_user_id_key') THEN
    ALTER TABLE public.recipe_likes
      ADD CONSTRAINT recipe_likes_recipe_id_user_id_key UNIQUE (recipe_id, user_id);
  END IF;

  -- recipe_ratings (recipe_id, user_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_ratings_recipe_id_user_id_key') THEN
    ALTER TABLE public.recipe_ratings
      ADD CONSTRAINT recipe_ratings_recipe_id_user_id_key UNIQUE (recipe_id, user_id);
  END IF;

  -- comment_likes (comment_id, user_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comment_likes_comment_id_user_id_key') THEN
    ALTER TABLE public.comment_likes
      ADD CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);
  END IF;

  -- user_follows (follower_id, following_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_follows_follower_id_following_id_key') THEN
    ALTER TABLE public.user_follows
      ADD CONSTRAINT user_follows_follower_id_following_id_key UNIQUE (follower_id, following_id);
  END IF;

  -- user_blocks (blocker_id, blocked_id) — prod 제약명이 _unique 라 그대로 맞춤
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_blocks_unique') THEN
    ALTER TABLE public.user_blocks
      ADD CONSTRAINT user_blocks_unique UNIQUE (blocker_id, blocked_id);
  END IF;
END $$;
