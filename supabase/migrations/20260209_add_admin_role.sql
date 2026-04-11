-- ================================================
-- Admin Role System Migration for 낼름
-- ================================================

-- 1. profiles 테이블에 role 필드 추가
ALTER TABLE profiles
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));

CREATE INDEX idx_profiles_role ON profiles(role) WHERE role = 'admin';

-- 2. 관리자 활동 로그 테이블
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- 3. 차단된 사용자 테이블
CREATE TABLE banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  ban_type VARCHAR(20) DEFAULT 'permanent',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_banned_users_user_id ON banned_users(user_id);

-- 4. 레시피 소프트 삭제 필드
ALTER TABLE recipes
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN deletion_reason TEXT;

CREATE INDEX idx_recipes_deleted ON recipes(deleted_at) WHERE deleted_at IS NOT NULL;

-- 5. 신고 테이블에 처리 정보 추가
ALTER TABLE reports
ADD COLUMN action_taken VARCHAR(50);

-- 6. RLS 활성화
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책
CREATE POLICY "Admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view banned users"
  ON banned_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage banned users"
  ON banned_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any recipe"
  ON recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 8. 헬퍼 함수
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM banned_users
    WHERE user_id = user_id
    AND (ban_type = 'permanent' OR (ban_type = 'temporary' AND expires_at > NOW()))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 대시보드 통계 뷰
CREATE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users_week,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_month,
  (SELECT COUNT(*) FROM recipes WHERE is_published = true) AS total_recipes,
  (SELECT COUNT(*) FROM recipes WHERE created_at >= NOW() - INTERVAL '7 days') AS new_recipes_week,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') AS pending_reports,
  (SELECT COUNT(*) FROM banned_users) AS banned_users_count,
  (SELECT COUNT(*) FROM recipe_views WHERE created_at >= NOW() - INTERVAL '24 hours') AS views_today,
  (SELECT COUNT(*) FROM recipe_comments WHERE created_at >= NOW() - INTERVAL '7 days') AS comments_week;

-- 10. 코멘트 추가
COMMENT ON TABLE admin_actions IS 'Audit log for all admin actions';
COMMENT ON TABLE banned_users IS 'List of banned users with ban details';
COMMENT ON COLUMN profiles.role IS 'User role: user or admin';

-- ================================================
-- 첫 관리자 설정 (수동으로 실행):
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- ================================================
