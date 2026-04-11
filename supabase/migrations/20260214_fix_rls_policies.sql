-- ================================================
-- RLS 정책 수정
-- cooking_sessions, recipe_likes, recipe_saves 테이블에 대한
-- Row Level Security 정책 추가 및 수정
-- ================================================

-- 1. cooking_sessions 테이블 RLS 활성화 및 정책 추가
-- ================================================

-- RLS 활성화 (아직 안되어 있다면)
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can manage own cooking sessions" ON cooking_sessions;

-- 사용자가 자신의 요리 세션을 관리할 수 있는 정책
CREATE POLICY "Users can manage own cooking sessions"
  ON cooking_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can manage own cooking sessions" ON cooking_sessions IS
'사용자는 자신의 요리 세션만 조회, 생성, 수정, 삭제할 수 있습니다';


-- 2. recipe_likes 테이블 정책 수정
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can like" ON recipe_likes;

-- 새로운 정책 추가 (WITH CHECK 포함)
CREATE POLICY "Users can manage own likes"
  ON recipe_likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can manage own likes" ON recipe_likes IS
'사용자는 자신의 좋아요만 조회, 생성, 삭제할 수 있습니다';


-- 3. recipe_saves 테이블 정책 수정
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can manage own saves" ON recipe_saves;

-- 새로운 정책 추가 (WITH CHECK 명시적 포함)
CREATE POLICY "Users can manage own saves"
  ON recipe_saves
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can manage own saves" ON recipe_saves IS
'사용자는 자신의 레시피 저장만 조회, 생성, 삭제할 수 있습니다';


-- 4. 인덱스 확인 및 생성 (성능 최적화)
-- ================================================

-- cooking_sessions 인덱스 (이미 있다면 무시됨)
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user_recipe
  ON cooking_sessions(user_id, recipe_id);

CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user_completed
  ON cooking_sessions(user_id, completed_at)
  WHERE completed_at IS NOT NULL;


-- 5. 정책 적용 확인
-- ================================================

-- RLS가 활성화되었는지 확인하는 쿼리 (참고용)
-- SELECT
--   schemaname,
--   tablename,
--   rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('cooking_sessions', 'recipe_likes', 'recipe_saves');

-- 생성된 정책 확인하는 쿼리 (참고용)
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename IN ('cooking_sessions', 'recipe_likes', 'recipe_saves')
-- ORDER BY tablename, policyname;
