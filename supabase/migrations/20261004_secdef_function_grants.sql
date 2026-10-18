-- =============================================================================
-- 2026-10-04 — SECURITY DEFINER 함수 실행 권한 정리
--
-- ✅ 2026-10-18 적용: naelum-dev → 검증(아래 권한 쿼리 + 전체 e2e 482 통과) → naelum(prod).
--    공개 저장소라 적용 전까지 로컬에만 두었고, 적용 후 커밋.
--
-- 발견 경위: prod Security Advisor(0028/0029) + pg_proc 정의 실측(2026-10-04).
--
-- 1) toggle_recipe_like / toggle_post_like — 호출자 본인 확인 추가
--    두 함수는 SECURITY DEFINER(RLS 우회)인데 p_user_id 를 호출자와 대조하지 않았고, anon 에도 EXECUTE 가 있었다.
--    앱은 두 함수를 *로그인 세션 클라이언트*로만 호출하고 p_user_id = 검증된 user.id 를 넘긴다
--    (app/api/recipes/[id]/like/route.ts, app/api/recipes/[id]/posts/[postId]/like/route.ts)
--    → 함수 안에서 p_user_id = auth.uid() 를 강제해도 앱 동작은 그대로다.
--
-- 2) check_rate_limit / cleanup_rate_limits / admin_unresolved_ingredients(_summary) — 서비스 롤 전용인데 공개
--    20260411_rate_limits.sql·20260529/20260530 마이그레이션이 `REVOKE ... FROM PUBLIC` 만 했는데,
--    Supabase 는 public 스키마 함수에 anon·authenticated 로 *직접* EXECUTE 를 부여(default privileges)
--    하므로 제한이 실제로는 걸리지 않았다(advisor 실측: anon 실행 가능).
--    앱은 네 함수를 전부 서비스 롤 클라이언트로만 호출한다(lib/ratelimit.ts, lib/security/loginLimiter.ts,
--    app/api/cron/cleanup-rate-limits/route.ts, app/api/admin/ingredient-matching/route.ts)
--    → anon·authenticated 회수해도 앱 동작은 그대로다.
--
-- 건드리지 않은 것(의도적으로 공개 유지):
--    increment_recipe_views — 비로그인 조회수 집계가 세션(anon) 클라이언트로 호출.
--    is_user_banned — RLS 정책 평가에서 호출될 수 있어 회수하면 정책이 깨질 수 있음.
--    recipe_cooked_count — 20260609 에서 의도적으로 anon·authenticated 부여(전역 집계).
--
-- 검증(적용 후):
--    select has_function_privilege('anon', 'public.toggle_recipe_like(uuid,uuid)', 'EXECUTE');  -- false
--    select has_function_privilege('authenticated', 'public.check_rate_limit(text,bigint,integer)', 'EXECUTE');  -- false
--    e2e: authed-recipe-detail(좋아요) · recipe-posts(글 좋아요) · auth(로그인 rate limit) · admin-ingredient-matching
-- =============================================================================

-- ── 1) 좋아요 토글: 호출자 본인만 ───────────────────────────────────────────────
-- 본문은 prod 정의(pg_get_functiondef, 2026-10-04)와 동일하고 맨 앞 본인 확인만 추가했다.
CREATE OR REPLACE FUNCTION public.toggle_recipe_like(p_recipe_id uuid, p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_like_id UUID;
  v_liked BOOLEAN;
BEGIN
  -- 호출자 본인 확인 (SECURITY DEFINER 라 RLS 가 막아주지 않는다)
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 레시피 존재 확인
  IF NOT EXISTS (SELECT 1 FROM recipes WHERE id = p_recipe_id) THEN
    RAISE EXCEPTION '레시피를 찾을 수 없습니다' USING ERRCODE = 'P0001';
  END IF;

  -- 기존 좋아요 확인
  SELECT id INTO v_existing_like_id
  FROM recipe_likes
  WHERE recipe_id = p_recipe_id AND user_id = p_user_id;

  IF v_existing_like_id IS NOT NULL THEN
    DELETE FROM recipe_likes WHERE id = v_existing_like_id;
    v_liked := FALSE;
  ELSE
    INSERT INTO recipe_likes (recipe_id, user_id) VALUES (p_recipe_id, p_user_id);
    v_liked := TRUE;
  END IF;

  RETURN json_build_object('liked', v_liked);
END;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_owner uuid; v_exists uuid;
begin
  -- 호출자 본인 확인 (SECURITY DEFINER 라 RLS 가 막아주지 않는다)
  if p_user_id is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select user_id into v_owner from recipe_posts where id = p_post_id and is_deleted = false;
  if v_owner is null then raise exception 'post not found' using errcode = 'P0001'; end if;
  if v_owner = p_user_id then raise exception 'cannot like own post' using errcode = 'P0002'; end if;
  select id into v_exists from post_likes where post_id = p_post_id and user_id = p_user_id;
  if v_exists is not null then delete from post_likes where id = v_exists; return false;
  else insert into post_likes (post_id, user_id) values (p_post_id, p_user_id); return true; end if;
end; $function$;

REVOKE EXECUTE ON FUNCTION public.toggle_recipe_like(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.toggle_post_like(uuid, uuid)   FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.toggle_recipe_like(uuid, uuid) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.toggle_post_like(uuid, uuid)   TO authenticated, service_role;

-- ── 2) 서비스 롤 전용 함수: anon·authenticated 회수 ──────────────────────────────
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, bigint, integer)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits()                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_unresolved_ingredients(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_unresolved_ingredients_summary()         FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_rate_limit(text, bigint, integer)        TO service_role;
GRANT  EXECUTE ON FUNCTION public.cleanup_rate_limits()                          TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_unresolved_ingredients(integer, integer) TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_unresolved_ingredients_summary()         TO service_role;
