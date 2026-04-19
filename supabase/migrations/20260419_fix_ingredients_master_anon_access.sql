-- Fix: anon 유저의 autocomplete 500 에러
-- 원인: "Admins can view all ingredients" PERMISSIVE 정책이 profiles 테이블을 조회하는데,
--       anon 역할은 profiles SELECT 권한이 없어 쿼리 자체가 실패 (42501 permission denied).
--       Postgres RLS는 PERMISSIVE 정책을 OR로 조합하지만, 하나가 에러면 쿼리 전체가 중단됨.
-- 해결: admin SELECT/UPDATE/DELETE 정책 제거. 관리자 작업은 service role로 대체.
--       "Public can view approved ingredients"는 유지 (anon 자동완성은 이걸로 통과).
DROP POLICY IF EXISTS "Admins can view all ingredients" ON public.ingredients_master;
DROP POLICY IF EXISTS "Admins can update ingredients" ON public.ingredients_master;
DROP POLICY IF EXISTS "Admins can delete ingredients" ON public.ingredients_master;
