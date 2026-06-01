-- recipe-completion-photos 버킷 + Storage RLS 정책
--
-- 배경(H2): /api/recipes/[id]/complete 가 매 요청 createBucket 으로 버킷을 지연 생성하고
-- 있었음(무검증 업로드 + lib/storage 우회). 라우트를 lib/storage 경유 + 검증으로 고치면서
-- 버킷을 인프라로 사전 프로비저닝한다. prod 에는 이미 동일 버킷·정책 존재(지연 생성 흔적) —
-- 이 마이그레이션은 dev 드리프트 복구용이며 멱등이라 prod 재적용도 안전.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-completion-photos',
  'recipe-completion-photos',
  true,
  5242880, -- 5MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- 공개 조회 (public 버킷)
drop policy if exists "Anyone can view completion photos" on storage.objects;
create policy "Anyone can view completion photos"
  on storage.objects for select
  using (bucket_id = 'recipe-completion-photos');

-- 본인 폴더(첫 경로 세그먼트 = auth.uid())에만 업로드
drop policy if exists "Users can upload their own completion photos" on storage.objects;
create policy "Users can upload their own completion photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recipe-completion-photos'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 본인 객체만 수정
drop policy if exists "Users can update their own completion photos" on storage.objects;
create policy "Users can update their own completion photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'recipe-completion-photos'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 본인 객체만 삭제
drop policy if exists "Users can delete their own completion photos" on storage.objects;
create policy "Users can delete their own completion photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'recipe-completion-photos'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );
