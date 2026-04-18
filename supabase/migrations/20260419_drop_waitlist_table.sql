-- Waitlist 기능 제거. 이메일 수집 폼이 실제 전환에 기여하지 않는다고 판단되어
-- UI/API와 함께 테이블 제거. 삭제 시점 양쪽 DB 모두 0 rows.
DROP TABLE IF EXISTS public.waitlist;
