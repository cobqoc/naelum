-- 가공식품 플래그 — 재료 추가 모달에서 별도 탭으로 묶기 위한 컬럼.
-- 도감(/ingredients)은 기존 category(meat·seafood·grain·...) 그대로 사용해 정확한 세분화 유지.
-- 모달은 광범위하게 "가공식품" 탭 1개로 묶어 빠른 추가 UX 제공.

ALTER TABLE ingredients_master
  ADD COLUMN IF NOT EXISTS is_processed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN ingredients_master.is_processed IS
  '가공식품 플래그 — 재료 추가 모달의 가공식품 탭 필터링용. 도감의 category와 별개';
