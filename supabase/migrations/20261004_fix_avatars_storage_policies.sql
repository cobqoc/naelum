-- =============================================================================
-- 2026-10-04 — avatars 스토리지 정책 수정 (아바타 업로드가 구조적으로 불가능하던 문제)
--
-- ⚠️ 미적용(작성만). CLAUDE.md DB 흐름대로 naelum-dev 에 먼저 apply → 설정·온보딩 아바타 업로드 확인 → naelum(prod).
--
-- prod 실측(2026-10-04, pg_policies) — 현재 정책:
--   INSERT WITH CHECK: auth.uid() = (split_part(name,'/',2) || split_part(split_part(name,'/',2),'-',1))
--                      AND auth.uid() = split_part(split_part(name,'/',2),'-',1)
--     → uid 가 "X||Y" 와 "Y" 에 동시에 같아야 해서 *절대 참이 될 수 없다*.
--   UPDATE/DELETE USING: auth.uid() = split_part(<파일명>,'-',1)
--     → UUID 자체에 '-' 가 있어 앞 8자리와만 비교 → 역시 항상 거짓.
-- 그래서 설정·온보딩 아바타 업로드는 늘 RLS 로 실패했다:
--   - 설정: 실패 시 미리보기 base64 data: URL 을 profiles.avatar_url 에 저장하고 성공 토스트 → 바뀐 것처럼 보이지만
--     수 MB 문자열이 프로필을 조인하는 모든 응답에 실린다. 이 폴백 제거(PAU-17)는 이 정책을 적용한 *뒤에* 하도록
--     코드에 보류 표시만 해 둠(app/[lang]/settings/page.tsx 의 PAU-17 주석).
--   - 온보딩: 실패를 콘솔에만 남기고 아바타 없이 진행.
--
-- 앱의 객체 이름(코드 실측):
--   설정  app/[lang]/settings/page.tsx        → 'avatars/<uid>-<timestamp>.<ext>'
--   온보딩 components/Onboarding/OnboardingWizard.tsx → '<uid>-<timestamp>.<ext>'
-- 두 경로 모두 *파일명(마지막 경로 조각)이 '<uid>-' 로 시작* 하므로 그 조건으로 본인 소유를 판정한다.
-- (SELECT 'Anyone can view avatars' 는 그대로 — 공개 버킷 읽기)
-- =============================================================================

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND starts_with(storage.filename(name), (auth.uid())::text || '-')
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND starts_with(storage.filename(name), (auth.uid())::text || '-')
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND starts_with(storage.filename(name), (auth.uid())::text || '-')
  );

-- 검증(적용 후, 로그인 사용자 세션에서):
--   설정 > 프로필 > 아바타 변경 → 저장 성공 + profiles.avatar_url 이 https://…/storage/v1/object/public/avatars/avatars/<uid>-… 형태
--   다른 사용자 uid 로 시작하는 이름 업로드 → RLS 거부
