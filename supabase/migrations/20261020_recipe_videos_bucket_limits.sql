-- 2026-10-20 AG2-10: 레시피 영상 직접 업로드(/api/upload-video/sign) 도입에 맞춘 버킷 제한.
-- 서명 URL 업로드는 파일 본문이 서버를 거치지 않으므로, 형식·크기 강제는 버킷 설정이 맡는다.
-- 50MB = Supabase 무료 플랜의 파일당 최대치(버킷 제한은 전역 제한을 넘을 수 없음).
-- 코드 쪽 같은 값: lib/storage/videoUpload.ts VIDEO_MAX_SIZE·VIDEO_ALLOWED_TYPES — 바꿀 땐 둘 다.

UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm']
WHERE id = 'recipe-videos';
