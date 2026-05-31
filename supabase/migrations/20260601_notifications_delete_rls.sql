-- notifications DELETE RLS 정책 추가 (AUDIT_2026-05-31 H12)
--
-- 배경: notifications 에 SELECT(own)·UPDATE(own) 정책만 있고 DELETE 정책이
--       dev·prod 양쪽 모두 없었다(2026-06-01 pg_policies 실측). 그 결과
--       DELETE /api/notifications 가 RLS 에 막혀 0행 삭제 → 사용자가 알림을
--       지워도 새로고침 시 부활(.error 미체크라 실패도 조용).
--       INSERT 는 cron·시스템이 service-role 로 넣으므로 user INSERT 정책 불필요.
--
-- 멱등(idempotent): DROP IF EXISTS 후 CREATE.

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
