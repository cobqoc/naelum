-- 장보기 항목별 한 줄 메모 — "유기농 우대", "마트A 1+1" 같은 개인 메모.
-- NULL 허용, 길이 제한은 클라이언트에서 200자.
ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS note TEXT;
