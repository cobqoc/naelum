-- 2026-10-20: recipe-videos 업로드 정책을 다른 사용자 버킷(recipe-completion-photos·contact-screenshots)과 같은 형태로 맞춘다.
-- 업로드 경로는 둘 다 `${user.id}/${Date.now()}.${ext}` (api/upload-video, api/upload-video/sign).

DROP POLICY IF EXISTS "Authenticated users can upload recipe videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload recipe videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-videos'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
