-- 통합 피드: recipe_posts + post_likes (recipe_ratings + recipe_comments + comment_likes 통합)
--
-- 배경: 레시피 상세의 "리뷰(평점)"와 "댓글"이 별개 테이블이라 한 피드로 합치기 어려웠음
-- (페이지네이션·답글·정렬·리뷰에 답글달기 불가). 단일 테이블로 통합해 근본 해결.
--   - 리뷰  = 최상위 post + rating(1~5) + (선택)photo_url  → "✓만들어봤어요" 인증 글
--   - 댓글  = 최상위 post + rating NULL
--   - 답글  = parent_id 있는 post (1단만), rating NULL
-- average_rating/ratings_count = rating 있는 글, comments_count = rating 없는 글.
--
-- 이 마이그레이션은 **추가형(additive)** — 기존 recipe_ratings/recipe_comments/comment_likes 는
-- 그대로 두고 새 테이블만 만든다. 0행이라 카운트 트리거 충돌 없음(빈 테이블). API 컷오버 후
-- 별도 마이그레이션에서 옛 테이블·트리거를 정리한다.

create table if not exists recipe_posts (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid not null references recipes(id) on delete cascade,
  -- user_id → profiles(id) (auth.users 아님) — PostgREST 가 user:profiles 임베드하려면 필수.
  -- profiles.id 자체가 auth.users(id) 를 참조하므로 실질 동일. 옛 recipe_comments/ratings 와 동일 패턴.
  user_id      uuid not null references profiles(id) on delete cascade,
  parent_id    uuid references recipe_posts(id) on delete cascade,  -- 답글 (1단)
  content      text,                                                -- 리뷰는 비어도 됨(별점만)
  rating       smallint check (rating is null or rating between 1 and 5),
  photo_url    text,
  likes_count  integer not null default 0,
  is_edited    boolean not null default false,
  is_deleted   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- 별점은 최상위 글에만(답글/댓글엔 별점 없음)
  constraint recipe_posts_rating_toplevel_only check (rating is null or parent_id is null)
);

-- 유저당 리뷰 1개 (별점 있는 최상위 글). 댓글·답글은 무제한.
create unique index if not exists recipe_posts_one_review_per_user
  on recipe_posts(recipe_id, user_id) where rating is not null;
create index if not exists recipe_posts_recipe_created
  on recipe_posts(recipe_id, created_at desc);
create index if not exists recipe_posts_parent on recipe_posts(parent_id);

create table if not exists post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references recipe_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

-- ── 답글 1단 강제: 답글의 부모는 최상위여야 함(답글의 답글 금지) ──
create or replace function trg_recipe_posts_depth() returns trigger as $$
begin
  if new.parent_id is not null
     and exists (select 1 from recipe_posts where id = new.parent_id and parent_id is not null) then
    raise exception 'replies can only be one level deep';
  end if;
  return new;
end; $$ language plpgsql set search_path = public;

drop trigger if exists trigger_recipe_posts_depth on recipe_posts;
create trigger trigger_recipe_posts_depth
  before insert or update on recipe_posts
  for each row execute function trg_recipe_posts_depth();

-- ── recipes 의 denormalized 카운트 유지 (옛 trigger_update_recipe_rating/comments 대체) ──
create or replace function refresh_recipe_post_counts(p_recipe_id uuid) returns void as $$
begin
  update recipes set
    average_rating = coalesce(
      (select round(avg(rating)::numeric, 1) from recipe_posts
        where recipe_id = p_recipe_id and rating is not null and is_deleted = false), 0),
    ratings_count = (select count(*) from recipe_posts
        where recipe_id = p_recipe_id and rating is not null and is_deleted = false),
    comments_count = (select count(*) from recipe_posts
        where recipe_id = p_recipe_id and rating is null and is_deleted = false)
  where id = p_recipe_id;
end; $$ language plpgsql security definer set search_path = public;

create or replace function trg_recipe_posts_counts() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    perform refresh_recipe_post_counts(old.recipe_id);
    return old;
  end if;
  perform refresh_recipe_post_counts(new.recipe_id);
  return new;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists trigger_recipe_posts_counts on recipe_posts;
create trigger trigger_recipe_posts_counts
  after insert or update or delete on recipe_posts
  for each row execute function trg_recipe_posts_counts();

-- ── post_likes → recipe_posts.likes_count 유지 ──
create or replace function trg_post_likes_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update recipe_posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update recipe_posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists trigger_post_likes_count on post_likes;
create trigger trigger_post_likes_count
  after insert or delete on post_likes
  for each row execute function trg_post_likes_count();

-- ── RLS: user-context write 정책 필수 (감사 반복 교훈) ──
alter table recipe_posts enable row level security;
drop policy if exists "recipe_posts readable by all" on recipe_posts;
create policy "recipe_posts readable by all" on recipe_posts for select using (true);
drop policy if exists "users insert own recipe_posts" on recipe_posts;
create policy "users insert own recipe_posts" on recipe_posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users update own recipe_posts" on recipe_posts;
create policy "users update own recipe_posts" on recipe_posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own recipe_posts" on recipe_posts;
create policy "users delete own recipe_posts" on recipe_posts for delete to authenticated using (auth.uid() = user_id);

alter table post_likes enable row level security;
drop policy if exists "post_likes readable by all" on post_likes;
create policy "post_likes readable by all" on post_likes for select using (true);
drop policy if exists "users insert own post_likes" on post_likes;
create policy "users insert own post_likes" on post_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users delete own post_likes" on post_likes;
create policy "users delete own post_likes" on post_likes for delete to authenticated using (auth.uid() = user_id);

-- ── 좋아요 토글 RPC (원자적 + 본인글 차단) — 옛 toggle_comment_like 대체 ──
create or replace function toggle_post_like(p_post_id uuid, p_user_id uuid)
returns boolean as $$
declare v_owner uuid; v_exists uuid;
begin
  select user_id into v_owner from recipe_posts where id = p_post_id and is_deleted = false;
  if v_owner is null then raise exception 'post not found' using errcode = 'P0001'; end if;
  if v_owner = p_user_id then raise exception 'cannot like own post' using errcode = 'P0002'; end if;
  select id into v_exists from post_likes where post_id = p_post_id and user_id = p_user_id;
  if v_exists is not null then
    delete from post_likes where id = v_exists;
    return false;
  else
    insert into post_likes (post_id, user_id) values (p_post_id, p_user_id);
    return true;
  end if;
end; $$ language plpgsql security definer set search_path = public;
