-- =============================================================================
-- 2026-10-04 — delete_user() 정의 백필 (리포 ↔ DB 일치)
--
-- 계정 삭제 API(app/api/users/delete/route.ts)가 `supabase.rpc('delete_user')` 를 호출하는데, 이 함수 정의가
-- supabase/migrations·supabase-schema.sql 어디에도 없었다(prod DB 에만 수동으로 존재). 새 환경(dev 재구축·AWS 이전)
-- 에서 계정 삭제가 500 이 되는 재현 불가 상태였다.
--
-- 아래는 prod 의 현재 정의를 pg_get_functiondef 로 그대로 옮긴 것(2026-10-04 실측)이다. CREATE OR REPLACE 라
-- 이미 같은 정의가 있는 prod 에 적용해도 변화가 없다(멱등). 권한도 prod 실측 그대로: anon 실행 불가, authenticated 실행 가능.
-- ⚠️ 미적용(작성만) — 적용할 때도 CLAUDE.md 흐름대로 dev 먼저.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- 현재 로그인한 사용자 ID 가져오기
  current_user_id := auth.uid();

  -- 사용자가 인증되지 않은 경우 에러
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- auth.users 테이블에서 사용자 삭제
  -- ON DELETE CASCADE로 인해 profiles 및 모든 관련 데이터가 자동으로 삭제됨
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$function$;

-- prod 실측 권한과 동일하게(anon 불가, authenticated 가능).
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_user() TO authenticated, service_role;
