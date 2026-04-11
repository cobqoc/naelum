-- ================================================
-- 사용자 차단 테이블
-- ================================================
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_blocks_unique UNIQUE (blocker_id, blocked_id),
  CONSTRAINT user_blocks_no_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- ================================================
-- 이용약관 동의 기록 테이블
-- ================================================
CREATE TABLE IF NOT EXISTS user_terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  CONSTRAINT user_terms_unique UNIQUE (user_id, terms_version)
);

CREATE INDEX IF NOT EXISTS idx_user_terms_user ON user_terms_acceptance(user_id);

ALTER TABLE user_terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own terms acceptance"
  ON user_terms_acceptance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms acceptance"
  ON user_terms_acceptance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own terms acceptance"
  ON user_terms_acceptance FOR UPDATE
  USING (auth.uid() = user_id);

-- 관리자는 모든 약관 동의 기록 조회 가능
CREATE POLICY "Admins can view all terms acceptance"
  ON user_terms_acceptance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
