-- Fix: profiles 테이블 anon 컬럼 제한 수정
--
-- 문제: 20260413_restrict_profiles_anon_columns.sql 에서 컬럼 레벨 REVOKE를
-- 사용했으나, Supabase가 anon에게 테이블 레벨 SELECT를 부여하기 때문에
-- 컬럼 레벨 REVOKE는 효과가 없음 (PostgreSQL 권한 우선순위 상 테이블 레벨이 우선).
--
-- 해결: 테이블 레벨 SELECT를 revoke한 뒤 안전한 컬럼만 명시적으로 grant.

-- 1단계: anon의 테이블 레벨 SELECT 제거
REVOKE SELECT ON public.profiles FROM anon;

-- 2단계: 공개해도 안전한 컬럼만 anon에게 GRANT
-- (민감 정보: email, birth_date, gender, *_notifications, last_login_at,
--  onboarding_*, role, auth_provider, marketing_consent*, search_vector 제외)
GRANT SELECT (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  country,
  followers_count,
  following_count,
  recipes_count,
  level,
  experience_points,
  created_at,
  show_saved_to_public,
  show_cooked_to_public
) ON public.profiles TO anon;
