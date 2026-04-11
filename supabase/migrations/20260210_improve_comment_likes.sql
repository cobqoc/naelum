-- ================================================
-- 댓글 좋아요 기능 개선
-- 작성일: 2026-02-10
-- ================================================

-- ================================================
-- 1. 댓글 좋아요 카운트 자동 업데이트 트리거
-- ================================================

-- 트리거 함수: 댓글 좋아요 카운트 업데이트
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 좋아요 추가 시 카운트 증가
    UPDATE recipe_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- 좋아요 삭제 시 카운트 감소 (0 미만 방지)
    UPDATE recipe_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_comment_likes ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- ================================================
-- 2. 댓글 좋아요 토글 RPC 함수 (트랜잭션 처리)
-- ================================================

-- RPC 함수: 댓글 좋아요 토글
CREATE OR REPLACE FUNCTION toggle_comment_like(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_existing_like_id UUID;
  v_comment_user_id UUID;
  v_liked BOOLEAN;
BEGIN
  -- 댓글 정보 조회 (존재 여부 확인 및 작성자 확인)
  SELECT user_id INTO v_comment_user_id
  FROM recipe_comments
  WHERE id = p_comment_id;

  -- 댓글이 존재하지 않음
  IF v_comment_user_id IS NULL THEN
    RAISE EXCEPTION '댓글을 찾을 수 없습니다'
      USING ERRCODE = 'P0001';
  END IF;

  -- 본인 댓글에는 좋아요 불가
  IF v_comment_user_id = p_user_id THEN
    RAISE EXCEPTION '본인 댓글에는 좋아요를 누를 수 없습니다'
      USING ERRCODE = 'P0002';
  END IF;

  -- 기존 좋아요 확인
  SELECT id INTO v_existing_like_id
  FROM comment_likes
  WHERE comment_id = p_comment_id AND user_id = p_user_id;

  -- 좋아요 토글 (트랜잭션 내에서 자동 처리)
  IF v_existing_like_id IS NOT NULL THEN
    -- 좋아요 취소
    DELETE FROM comment_likes WHERE id = v_existing_like_id;
    v_liked := FALSE;
  ELSE
    -- 좋아요 추가
    INSERT INTO comment_likes (comment_id, user_id)
    VALUES (p_comment_id, p_user_id);
    v_liked := TRUE;
  END IF;

  -- 결과 반환
  RETURN json_build_object('liked', v_liked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 함수에 대한 권한 설정
GRANT EXECUTE ON FUNCTION toggle_comment_like(UUID, UUID) TO authenticated;

-- ================================================
-- 3. 기존 데이터 정합성 체크 및 수정
-- ================================================

-- 모든 댓글의 likes_count를 실제 좋아요 수로 업데이트
UPDATE recipe_comments rc
SET likes_count = (
  SELECT COUNT(*)
  FROM comment_likes cl
  WHERE cl.comment_id = rc.id
)
WHERE EXISTS (
  SELECT 1
  FROM comment_likes cl
  WHERE cl.comment_id = rc.id
  GROUP BY cl.comment_id
  HAVING COUNT(*) != rc.likes_count
);

-- ================================================
-- 4. 인덱스 최적화 (이미 있으면 스킵)
-- ================================================

-- comment_likes에 복합 인덱스 추가 (이미 있을 수 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_comment_likes_user_id'
  ) THEN
    CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
  END IF;
END $$;

-- ================================================
-- 5. 주석 추가
-- ================================================

COMMENT ON FUNCTION update_comment_likes_count() IS '댓글 좋아요 카운트 자동 업데이트 트리거 함수';
COMMENT ON FUNCTION toggle_comment_like(UUID, UUID) IS '댓글 좋아요 토글 RPC 함수 (트랜잭션 안전)';

-- ================================================
-- 완료
-- ================================================
-- 이 마이그레이션은 다음을 수행합니다:
-- 1. comment_likes 테이블에 INSERT/DELETE 시 자동으로 likes_count 업데이트
-- 2. 트랜잭션 안전한 RPC 함수로 동시성 문제 해결
-- 3. 기존 데이터의 정합성 체크 및 수정
-- ================================================
