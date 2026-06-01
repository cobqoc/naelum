-- ⚠️⚠️ 적용 금지(POST-MERGE ONLY) ⚠️⚠️
-- 통합 피드(recipe_posts) 전환 후 옛 테이블 정리. **develop→main 머지 + Vercel 배포가
-- 완료된 뒤에만** dev+prod 에 적용할 것. 현 prod(main) 코드가 아직 이 테이블들을 읽으면
-- 머지 전에 drop 하면 prod 가 깨진다.
--
-- 전제: prod·dev 모두 이 세 테이블 0행(2026-06-01 확인). 신규 쓰기는 컷오버 후 전부
-- recipe_posts/post_likes 로 감. 적용 전 한 번 더 count 확인 권장.
--
-- 적용 순서(머지+배포 후):
--   1) select count(*) from recipe_ratings; recipe_comments; comment_likes;  -- 0 확인
--   2) 아래 실행 (dev → 검증 → prod)

drop table if exists comment_likes cascade;
drop table if exists recipe_comments cascade;
drop table if exists recipe_ratings cascade;

-- 옛 전용 함수/트리거 정리 (테이블 drop 시 트리거는 같이 사라지나, 함수는 남으므로 명시 제거)
drop function if exists toggle_comment_like(uuid, uuid) cascade;
drop function if exists update_recipe_ratings(uuid) cascade;

-- 주의: recipes.average_rating/ratings_count/comments_count 컬럼은 유지(recipe_posts
-- 트리거가 계속 갱신). cooking_sessions 도 유지(쿠킹모드·트렌딩·프로필).
