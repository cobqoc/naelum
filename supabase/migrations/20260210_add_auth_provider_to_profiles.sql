-- profiles 테이블에 auth_provider 컬럼 추가
ALTER TABLE profiles
ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'email'
CHECK (auth_provider IN ('email', 'google'));

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_profiles_auth_provider ON profiles(auth_provider);

-- 기존 사용자는 email provider로 설정 (기본값 사용)
-- 새로운 컬럼이므로 기존 사용자는 자동으로 'email'로 설정됨

COMMENT ON COLUMN profiles.auth_provider IS
'Authentication provider used for this account (email or google). Immutable after creation.';
