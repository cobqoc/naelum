-- 자체 analytics 시스템 — 사용자 행동 추적용 이벤트 로깅.
-- 페이지뷰·클릭·폼 제출 등 event_type별 기록.
--
-- 호환 메모:
-- - search_history·recommendation_history는 그대로 유지 (분리). events는 일반 행동 분석용.
-- - user_id nullable: 비로그인 사용자도 session_id로 식별
-- - GDPR: CookieConsent.analytics 동의한 사용자만 트래킹 (클라이언트 헬퍼에서 가드)
-- - 보존: 추후 90일 retention cron 추가 검토 (rate_limits cron 패턴 참고)

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb,
  page text,
  viewport_w int,
  viewport_h int,
  ua text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 분석 쿼리 최적화 인덱스
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS events_user_idx ON events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS events_session_idx ON events (session_id, created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 누구나 insert (비로그인 + 로그인). API endpoint에서 rate limit으로 보호.
CREATE POLICY "anyone can insert events"
  ON events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- admin role만 select (대시보드용)
CREATE POLICY "admin can select events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 비로그인 update/delete 차단 (서버 service role만 가능)
-- (RLS는 default deny라 명시 정책 없음 = 차단)
