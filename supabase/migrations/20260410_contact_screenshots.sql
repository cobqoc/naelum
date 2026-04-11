-- ================================================
-- 문의 스크린샷 스토리지 버킷 및 contact_inquiries 컬럼 추가
-- ================================================

-- 1. contact-screenshots 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-screenshots', 'contact-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 인증된 사용자는 자신의 폴더에 업로드 가능
CREATE POLICY "Users can upload contact screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contact-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 공개 읽기 (public 버킷)
CREATE POLICY "Anyone can view contact screenshots"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'contact-screenshots');

-- 4. contact_inquiries 테이블에 screenshot_url 컬럼 추가
ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
