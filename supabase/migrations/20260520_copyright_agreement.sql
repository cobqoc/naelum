-- 저작권 조항 동의 — 가입 시 별도 체크박스로 받음 (글로벌 표준: Medium·Substack·WordPress 패턴).
-- 매 게시마다 받던 박스 제거. 한국 약관규제법 제3조 "중요한 내용 별도 명시" 요건 충족.
-- 분쟁 시 audit trail: copyright_agreed_at IS NOT NULL → 가입 시 명시 동의 확인.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS copyright_agreed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.copyright_agreed_at IS
  '저작권 조항(이용약관 제8조) 명시 동의 시각 — 가입 시 별도 체크박스 동의 audit trail';
