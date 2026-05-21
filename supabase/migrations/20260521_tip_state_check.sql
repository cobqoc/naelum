-- 팁 발행 상태 무결성 — 근본 버그 수정 (2026-05-21)
--
-- 문제: tip 의 발행 상태가 is_public·is_draft 2개 불리언으로 표현되는데,
-- 유효 상태는 3개(공개·비공개·임시저장)뿐인데 2개 불리언은 4개 조합을 허용.
-- 4번째 조합 is_public=true AND is_draft=true 는 "공개이면서 임시저장"이라는
-- 모순 상태. 이 모순 행이 생기면 GET /api/tip(is_public 만 필터)에는 공개로
-- 잡히고, 프로필 통계·users/[username]/tips(두 플래그 다 검사)에는 임시저장으로
-- 잡혀 화면 간 불일치 + 임시저장 글이 공개 목록에 새는 버그 발생.
--
-- 근본 차단: 모순 조합 자체를 DB 레벨에서 불가능하게 만든다.
--   1) 두 컬럼 NOT NULL  — 발행 상태가 항상 well-defined (기본값 존재, NULL 0건)
--   2) CHECK 제약        — is_public 과 is_draft 가 동시에 true 일 수 없음
-- 이후 어떤 경로(POST·PUT·직접 SQL)로도 모순 행을 만들 수 없어,
-- GET /api/tip 이 is_public 만 봐도 임시저장이 새지 않는다.

ALTER TABLE tip ALTER COLUMN is_public SET NOT NULL;
ALTER TABLE tip ALTER COLUMN is_draft  SET NOT NULL;

ALTER TABLE tip DROP CONSTRAINT IF EXISTS tip_publish_state_valid;
ALTER TABLE tip ADD CONSTRAINT tip_publish_state_valid
  CHECK (NOT (is_public AND is_draft));
