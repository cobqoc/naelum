-- contact_inquiries admin RLS 정책 추가 (AUDIT_2026-05-31 C8)
--
-- 배경: contact_inquiries 에는 INSERT(누구나) + SELECT(본인 문의만) 정책만 있고
--       admin 정책이 dev·prod 양쪽 모두 없었다(2026-06-01 pg_policies 실측 확인).
--       그 결과:
--         1) admin/inquiries 페이지가 API 안 거치고 *브라우저에서 직접* contact_inquiries
--            를 SELECT → RLS 가 admin 을 '일반 유저'로 취급 → 비로그인·타인 문의·저작권
--            신고(user_id=null)가 **운영자에게 안 보임**.
--         2) 상태 변경 UPDATE 도 정책이 없어 막힘 → 옵티미스틱 UI 가 조용히 원복.
--
-- 기존 reports 테이블 admin 정책(20260209_add_admin_role.sql)과 *동일 패턴*:
--   EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'admin').
-- 멱등(idempotent): DROP IF EXISTS 후 CREATE — dev·prod 모두 안전하게 재적용 가능.

DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view all inquiries"
  ON public.contact_inquiries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update inquiries"
  ON public.contact_inquiries FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
