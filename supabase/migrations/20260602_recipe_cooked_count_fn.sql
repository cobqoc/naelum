-- "만들어봤어요" 공개 집계 함수 — 피드 헤더 "🍳 N명이 만들어봤어요" 용.
--
-- cooking_sessions 의 SELECT RLS 는 `auth.uid() = user_id`(본인 것만) 이라, 유저 컨텍스트
-- 클라이언트로는 *다른 사람의* 만든 기록을 셀 수 없다(공개 카운트가 0/본인 것만으로 나옴).
-- SECURITY DEFINER 로 RLS 를 우회해 신원 노출 없이 distinct 유저 수만 반환한다(소셜 증거용).
create or replace function recipe_cooked_count(p_recipe_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(distinct user_id)::int
  from cooking_sessions
  where recipe_id = p_recipe_id and completed_at is not null;
$$;

grant execute on function recipe_cooked_count(uuid) to anon, authenticated;
