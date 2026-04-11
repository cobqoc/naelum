-- ================================================
-- 관리자 시스템 보안 강화 마이그레이션
-- ================================================

-- 1. reports 테이블 RLS 활성화 (아직 안 되어 있다면)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 2. 일반 사용자용 reports 정책 추가
-- 사용자는 자신이 작성한 신고만 조회 가능
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

-- 사용자는 신고를 작성할 수 있음
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- 3. is_user_banned 함수 버그 수정
-- 기존 함수의 WHERE user_id = user_id는 항상 참이므로 수정 필요
DROP FUNCTION IF EXISTS is_user_banned(UUID);

CREATE OR REPLACE FUNCTION is_user_banned(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM banned_users
    WHERE banned_users.user_id = check_user_id
    AND (ban_type = 'permanent' OR (ban_type = 'temporary' AND expires_at > NOW()))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 코멘트 추가
COMMENT ON FUNCTION is_user_banned IS '사용자가 차단되었는지 확인 (일시/영구 차단 모두 포함)';
COMMENT ON POLICY "Users can view own reports" ON reports IS '사용자는 자신이 작성한 신고만 조회 가능';
COMMENT ON POLICY "Users can create reports" ON reports IS '사용자는 신고를 작성할 수 있음';

-- ================================================
-- 보안 강화 완료
-- ================================================
