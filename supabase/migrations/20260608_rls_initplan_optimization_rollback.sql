-- 롤백: 20260608_rls_initplan_optimization.sql
-- ( SELECT auth.uid() AS uid) → auth.uid() (원복). 의미 동일, 멱등.
-- 정상 동작 시엔 적용할 필요 없음. advisor WARN 이 다시 90건으로 돌아옴.

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
      AND ( coalesce(qual, '')        LIKE '%( SELECT auth.uid() AS uid)%'
         OR coalesce(with_check, '')  LIKE '%( SELECT auth.uid() AS uid)%' )
  LOOP
    nq := CASE WHEN pol.qual IS NULL THEN NULL
      ELSE replace(pol.qual, '( SELECT auth.uid() AS uid)', 'auth.uid()') END;
    nc := CASE WHEN pol.with_check IS NULL THEN NULL
      ELSE replace(pol.with_check, '( SELECT auth.uid() AS uid)', 'auth.uid()') END;

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

  RAISE NOTICE 'rls_initplan rollback: unwrapped % policies', n;
END $$;
