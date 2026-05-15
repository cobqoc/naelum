-- 공유 cart (가족·룸메이트 read-only 공유) — Phase 1
-- 한 사용자가 자기 cart 전체를 단축 토큰으로 공유. 토큰 보유자는 인증 없이 read-only로 열람.
-- shopping_list_items의 RLS는 변경하지 않음 (자기 거만 조회). 공유 페이지는 API에서 토큰 검증 후
-- service role로 조회 → 보안 단순화.

CREATE TABLE IF NOT EXISTS shopping_list_shares (
  token            TEXT PRIMARY KEY,
  owner_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,                       -- NULL = 무기한 (revoke로만 종료)
  revoked_at       TIMESTAMPTZ,                       -- 사용자가 명시적 revoke 시 set
  view_count       INTEGER NOT NULL DEFAULT 0,
  last_viewed_at   TIMESTAMPTZ
);

-- 한 사용자당 활성 토큰 1개만 (단순화). 새 토큰 발급하려면 기존 거 먼저 revoke.
-- NOTE: NOW()는 IMMUTABLE이 아니라 partial index 술어에 못 씀.
-- expires_at 검사는 API 레벨에서 처리 (lookup 시 expires_at IS NULL OR expires_at > NOW()).
CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_list_shares_owner_active
  ON shopping_list_shares(owner_user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE shopping_list_shares ENABLE ROW LEVEL SECURITY;

-- 본인만 자기 토큰 관리. 토큰 검증·조회는 service role로 API에서 처리.
DROP POLICY IF EXISTS "shopping_list_shares_own" ON shopping_list_shares;
CREATE POLICY "shopping_list_shares_own" ON shopping_list_shares
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());
