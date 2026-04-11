-- ================================================
-- 아바타 스토리지 버킷 및 RLS 정책 설정
-- ================================================

-- 1. avatars 버킷 생성 (이미 존재하면 무시됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. avatars 버킷의 RLS 활성화
-- (Supabase Storage 버킷은 기본적으로 RLS가 활성화되어 있음)

-- 3. 스토리지 객체 RLS 정책 설정

-- 정책 1: 인증된 사용자는 자신의 아바타를 업로드할 수 있음
-- 파일명 형식: {user_id}-{timestamp}.{extension}
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- 정책 2: 인증된 사용자는 자신의 아바타를 업데이트할 수 있음
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- 정책 3: 인증된 사용자는 자신의 아바타를 삭제할 수 있음
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- 정책 4: 모든 사람은 아바타를 볼 수 있음 (public 버킷)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ================================================
-- 완료
-- ================================================

COMMENT ON POLICY "Users can upload their own avatar" ON storage.objects IS
'Authenticated users can upload avatar images. Filename must start with their user ID.';

COMMENT ON POLICY "Users can update their own avatar" ON storage.objects IS
'Authenticated users can update their own avatar images.';

COMMENT ON POLICY "Users can delete their own avatar" ON storage.objects IS
'Authenticated users can delete their own avatar images.';

COMMENT ON POLICY "Anyone can view avatars" ON storage.objects IS
'Public read access to avatar images since the bucket is public.';
