-- RLS auth_rls_initplan 최적화: auth.uid() → ( SELECT auth.uid() )
--
-- 배경: prod advisor 가 90건의 auth_rls_initplan(WARN) 을 보고. RLS 정책의
--   auth.uid() 가 서브쿼리로 감싸이지 않아 반환 행마다 재평가됨. 로그인 사용자의
--   모든 쿼리에 곱해지는 비용. ( SELECT auth.uid() ) 로 감싸면 쿼리당 1회 평가.
--   Supabase 공식 권장 패턴. 가시 행/쓰기 권한 등 의미는 100% 동일.
--
-- 안전성:
--   * ALTER POLICY 만 사용 → cmd/permissive/roles 자동 보존, 원자적·가역적.
--   * 멱등: 이미 ( SELECT auth.uid() AS uid) 로 감싼 정책은 WHERE 가드로 제외.
--   * 이중래핑 방지: 치환 전 기존 래퍼를 bare 로 normalize 후 다시 wrap.
--   * 카탈로그를 직접 읽어 ALTER 생성 → 전사 오류 0, 환경(dev/prod) 무관.
--   * 이 프로젝트의 모든 정책은 auth.uid() 만 사용(auth.jwt/role/current_setting 없음) 확인됨.
--
-- 롤백: 20260608_rls_initplan_optimization_rollback.sql

DO $$
DECLARE
  pol  RECORD;
  nq   text;
  nc   text;
  stmt text;
  n    int := 0;
BEGIN
  FOR pol IN
    SELECT tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      -- 래핑된 형태( ( SELECT auth.uid() AS uid) )를 placeholder 로 지운 뒤에도
      -- bare 한 auth.uid() 가 남아 있는 정책만 = "아직 고칠 게 있는" 정책
      AND (
        replace(coalesce(qual, ''),        '( SELECT auth.uid() AS uid)', '#') LIKE '%auth.uid()%'
        OR replace(coalesce(with_check, ''), '( SELECT auth.uid() AS uid)', '#') LIKE '%auth.uid()%'
      )
  LOOP
    -- normalize(기존 래퍼 → bare) 후 wrap → 이중래핑 불가능
    nq := CASE WHEN pol.qual IS NULL THEN NULL
      ELSE replace(replace(pol.qual, '( SELECT auth.uid() AS uid)', 'auth.uid()'),
                   'auth.uid()', '( SELECT auth.uid() )') END;
    nc := CASE WHEN pol.with_check IS NULL THEN NULL
      ELSE replace(replace(pol.with_check, '( SELECT auth.uid() AS uid)', 'auth.uid()'),
                   'auth.uid()', '( SELECT auth.uid() )') END;

    stmt := 'ALTER POLICY ' || quote_ident(pol.policyname)
            || ' ON public.' || quote_ident(pol.tablename);
    IF pol.qual IS NOT NULL THEN
      stmt := stmt || ' USING (' || nq || ')';
    END IF;
    IF pol.with_check IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || nc || ')';
    END IF;

    EXECUTE stmt;
    n := n + 1;
  END LOOP;

  RAISE NOTICE 'rls_initplan: rewrote % policies', n;
END $$;
