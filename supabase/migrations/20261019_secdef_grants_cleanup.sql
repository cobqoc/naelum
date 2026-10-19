-- =============================================================================
-- 2026-10-19 — 함수 실행 권한·search_path 정리 (Security Advisor 0011/0028/0029 후속)
--
-- 20261004_secdef_function_grants.sql 이 남겨 둔 함수들을 정리한다. 모두 앱이 세션(anon·authenticated)
-- 클라이언트로 부르지 않는 함수다(웹 app/·lib/ 와 KMP 앱 저장소 grep, 2026-10-19).
--
-- 1) 트리거·이벤트 트리거 함수 — RPC 로 부를 이유가 없다.
--    트리거 발화는 EXECUTE 권한을 검사하지 않으므로 회수해도 트리거 동작은 그대로다.
--    handle_new_user · trg_post_likes_count · trg_recipe_posts_counts · update_recipe_saves_count ·
--    upsert_user_favorite_ingredient · rls_auto_enable(event trigger)
-- 2) 쓰이지 않는 함수 — decrement/increment_saves_count(20260514 부터 no-op, 호출 제거됨) ·
--    refresh_recipe_post_counts(trg_recipe_posts_counts 가 정의자 권한으로 호출) ·
--    is_user_banned(정책·코드 사용처 없음 — 차단 확인은 proxy 가 banned_users 를 직접 읽는다)
-- 3) increment_recipe_views — POST /api/recipes/[id]/view 가 쿠키·rate limit 확인 뒤 서비스 롤로 호출하게 바꿨다.
--    ⚠️ prod 는 그 코드가 배포된 *뒤에* 적용(옛 코드는 세션 클라이언트로 호출).
-- 4) search_path 고정 — 트리거 함수 4개.
--
-- 그대로 둔 것: recipe_cooked_count(의도적 공개 집계) · delete_user(본인 탈퇴, authenticated 필요) ·
--   toggle_*_like(20261004 에서 본인 확인 추가). 확장 pg_trgm·vector 의 public 스키마 이동은
--   인덱스·연산자 참조가 걸려 있어 하지 않는다. RLS 정책 없는 테이블 7개는 서비스 롤 전용(의도).
--
-- 검증(적용 후):
--   select has_function_privilege('anon', 'public.increment_recipe_views(uuid)', 'EXECUTE');      -- false
--   select has_function_privilege('authenticated', 'public.is_user_banned(uuid)', 'EXECUTE');     -- false
--   select has_function_privilege('anon', 'public.recipe_cooked_count(uuid)', 'EXECUTE');         -- true
-- =============================================================================

-- dev ↔ prod drift: dev 에는 rls_auto_enable·is_user_banned·trigger_set_updated_at·update_push_tokens_updated_at 가
-- 없다(2026-10-19 실측). 없는 함수는 건너뛴다.
DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.handle_new_user()', 'public.trg_post_likes_count()', 'public.trg_recipe_posts_counts()',
    'public.update_recipe_saves_count()', 'public.upsert_user_favorite_ingredient()', 'public.rls_auto_enable()',
    'public.decrement_saves_count(uuid)', 'public.increment_saves_count(uuid)',
    'public.refresh_recipe_post_counts(uuid)', 'public.is_user_banned(uuid)', 'public.increment_recipe_views(uuid)'
  ] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    END IF;
  END LOOP;

  FOREACH f IN ARRAY ARRAY[
    'public.trigger_set_updated_at()', 'public.update_push_tokens_updated_at()',
    'public.upsert_user_favorite_ingredient()', 'public.ensure_reverse_substitute()'
  ] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', f);
    END IF;
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.increment_recipe_views(uuid) TO service_role;
