-- GDPR 준수 쿠키 동의 스키마 재설계
--
-- 기존 cookie_consent BOOLEAN은 코드에서 'all'|'necessary' 문자열로 저장 시도 → 타입 에러 → silent fail.
-- 아래로 재설계: 카테고리별 consent + version + timestamp (감사 기록).

-- 1) 잘못된 기존 컬럼 제거
ALTER TABLE profiles DROP COLUMN IF EXISTS cookie_consent;

-- 2) GDPR-ready 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cookie_consent_version INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cookie_consent_analytics BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cookie_consent_marketing BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMPTZ DEFAULT NULL;

-- 3) 컬럼 의미 문서화 (GDPR 감사용)
COMMENT ON COLUMN profiles.cookie_consent_version IS
'사용자가 동의한 쿠키 정책 버전. 정책 변경 시 앱의 CURRENT_CONSENT_VERSION 상수를 올려서 강제 재동의를 유도.';

COMMENT ON COLUMN profiles.cookie_consent_analytics IS
'분석·에러 추적 쿠키(Sentry 등) 동의 여부. NULL = 아직 묻지 않음.';

COMMENT ON COLUMN profiles.cookie_consent_marketing IS
'마케팅/광고 쿠키 동의 여부. NULL = 아직 묻지 않음. 현재 미사용(추후 광고 도입 시 활성화).';

COMMENT ON COLUMN profiles.cookie_consent_at IS
'최근 동의 시점 (GDPR 감사 기록용). 동의 철회/재동의 시마다 업데이트.';

-- 4) RLS: 사용자는 자기 consent만 읽고 쓸 수 있음 (profiles 테이블 기존 RLS에 의해 이미 보호됨)
