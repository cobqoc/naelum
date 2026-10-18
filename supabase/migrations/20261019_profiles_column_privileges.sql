-- profiles SELECT 권한을 authenticated 도 anon 과 같은 컬럼 단위로 (2026-10-04 감사 AG2-18 — 데이터 최소화)
-- anon 은 20260415_fix_profiles_anon_column_security.sql 에서 이미 컬럼 단위였다.
--
-- authenticated = anon 공개 컬럼 + 게이트·RLS 가 읽는 role·onboarding_*·updated_at·search_vector.
-- 민감 컬럼(email, birth_date, gender, *_notifications, last_login_at, auth_provider, marketing_consent*,
-- cookie_consent_*, *_agreed_at)은 앱이 본인 행만 service-role 로 읽는다(같은 커밋의 라우트 변경).
-- UPDATE·INSERT 권한은 그대로(본인 행 RLS) — 설정·온보딩·쿠키 동의 저장 경로는 영향 없음.
-- ✅ 2026-10-19 dev 적용·검증(e2e 488) → prod 는 이 컬럼을 service-role 로 읽는 코드가 배포된 직후 적용.
-- 기본 권한(default privileges)으로 새 컬럼이 자동 공개되지 않는다 — 새 공개 컬럼은 여기에 GRANT 를 추가할 것.
REVOKE SELECT ON public.profiles FROM authenticated;

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
  show_cooked_to_public,
  role,
  onboarding_completed,
  onboarding_step,
  updated_at,
  search_vector
) ON public.profiles TO authenticated;
