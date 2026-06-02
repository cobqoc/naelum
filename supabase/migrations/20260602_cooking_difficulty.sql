-- 만들어봤어요 리디자인 — 만든 직후 "체감 난이도" 수집
-- 1=쉬웠어요, 2=적당, 3=어려웠어요 (선택 입력, NULL 허용)
-- 맛 별점(recipe_posts.rating)과 분리: 난이도는 과정 신호(만든 직후), 맛은 결과 신호(먹고 나서).
-- 집계·표시는 데이터 축적 후 (추천 섹션 부활 trigger와 동일). 지금은 수집만.

ALTER TABLE cooking_sessions
  ADD COLUMN IF NOT EXISTS difficulty_felt smallint
  CHECK (difficulty_felt BETWEEN 1 AND 3);

COMMENT ON COLUMN cooking_sessions.difficulty_felt IS
  '체감 난이도(만든 직후): 1=쉬움 2=적당 3=어려움. NULL=미입력. 작성자 난이도(recipes.difficulty)와 별개.';
