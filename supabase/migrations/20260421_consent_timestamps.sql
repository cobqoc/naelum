-- GDPR 감사 기록: Terms·Privacy 동의 타임스탬프
-- 기존엔 marketing_consent_at만 있었음 → terms/privacy도 추가.
-- GDPR Art. 7: "언제 동의했는지" 증명 가능해야 함.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.terms_agreed_at IS
'이용약관 동의 시점. GDPR Art. 7 감사 기록용. 재동의 시마다 갱신.';

COMMENT ON COLUMN profiles.privacy_agreed_at IS
'개인정보처리방침 동의 시점. GDPR Art. 7 감사 기록용. 재동의 시마다 갱신.';
