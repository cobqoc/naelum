# 댓글 좋아요 기능 개선 가이드

## 📋 개선 사항 요약

이번 업데이트로 댓글 좋아요 기능의 다음 문제들이 해결되었습니다:

### ✅ 해결된 문제

1. **데이터베이스 트리거 추가**
   - `comment_likes` 테이블에 INSERT/DELETE 시 자동으로 `likes_count` 업데이트
   - 데이터 일관성 보장

2. **트랜잭션 안전성 확보**
   - RPC 함수 `toggle_comment_like()`를 통한 원자적 처리
   - 동시성 문제 해결 (Race Condition 방지)

3. **N+1 쿼리 문제 해결**
   - 댓글 목록 조회 시 일괄 쿼리로 최적화
   - 답글 목록 조회 시 일괄 쿼리로 최적화
   - 응답 속도 대폭 개선 (20개 댓글 기준: 41개 쿼리 → 3개 쿼리)

---

## 🚀 마이그레이션 적용 방법

### 1. Supabase 대시보드에서 적용

1. Supabase 대시보드에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 버튼 클릭
5. 마이그레이션 파일 내용 복사 붙여넣기:

```bash
# 마이그레이션 파일 경로
supabase/migrations/20260210_improve_comment_likes.sql
```

6. **Run** 버튼 클릭하여 실행
7. 성공 메시지 확인

### 2. Supabase CLI로 적용 (로컬 개발 환경)

```bash
# Supabase CLI 설치 확인
supabase --version

# 로컬 Supabase 시작 (아직 안 했다면)
supabase start

# 마이그레이션 적용
supabase db push

# 또는 특정 마이그레이션만 적용
supabase migration up
```

### 3. 원격 프로덕션 환경에 적용

```bash
# Supabase 프로젝트 연결 확인
supabase link --project-ref your-project-ref

# 마이그레이션 적용
supabase db push
```

---

## 🧪 테스트 방법

### 1. 데이터베이스 트리거 테스트

Supabase SQL Editor에서 다음 쿼리를 실행하여 테스트:

```sql
-- 테스트용 댓글 ID와 사용자 ID 확인
SELECT id FROM recipe_comments LIMIT 1; -- 댓글 ID 복사
SELECT id FROM profiles LIMIT 1;        -- 사용자 ID 복사

-- 좋아요 추가 전 카운트 확인
SELECT id, likes_count FROM recipe_comments WHERE id = '댓글_ID';

-- 좋아요 추가
INSERT INTO comment_likes (comment_id, user_id)
VALUES ('댓글_ID', '사용자_ID');

-- 좋아요 추가 후 카운트 확인 (자동으로 1 증가해야 함)
SELECT id, likes_count FROM recipe_comments WHERE id = '댓글_ID';

-- 좋아요 삭제
DELETE FROM comment_likes
WHERE comment_id = '댓글_ID' AND user_id = '사용자_ID';

-- 좋아요 삭제 후 카운트 확인 (자동으로 1 감소해야 함)
SELECT id, likes_count FROM recipe_comments WHERE id = '댓글_ID';
```

### 2. RPC 함수 테스트

```sql
-- RPC 함수 호출 테스트
SELECT toggle_comment_like(
  '댓글_ID'::uuid,
  '사용자_ID'::uuid
);

-- 결과: {"liked": true} 또는 {"liked": false}
```

### 3. API 엔드포인트 테스트

#### 3.1 댓글 좋아요 토글 테스트

```bash
# 로그인 후 토큰 획득
# Authorization 헤더에 Bearer 토큰 추가

# 좋아요 추가
curl -X POST http://localhost:3000/api/recipes/{recipeId}/comments/{commentId}/like \
  -H "Authorization: Bearer YOUR_TOKEN"

# 응답: {"liked": true}

# 다시 호출하면 좋아요 취소
curl -X POST http://localhost:3000/api/recipes/{recipeId}/comments/{commentId}/like \
  -H "Authorization: Bearer YOUR_TOKEN"

# 응답: {"liked": false}
```

#### 3.2 댓글 목록 조회 성능 테스트

```bash
# 댓글 목록 조회 (is_liked 포함 확인)
curl -X GET http://localhost:3000/api/recipes/{recipeId}/comments \
  -H "Authorization: Bearer YOUR_TOKEN"

# 응답 확인:
# - comments 배열에 각 댓글의 is_liked 필드 존재
# - replies_count 필드 존재
```

---

## 📊 성능 개선 비교

### 변경 전
- 댓글 20개 조회 시: **41개 쿼리**
  - 댓글 목록 조회: 1개
  - 각 댓글의 좋아요 여부: 20개
  - 각 댓글의 답글 수: 20개

### 변경 후
- 댓글 20개 조회 시: **3개 쿼리**
  - 댓글 목록 조회: 1개
  - 모든 댓글의 좋아요 여부 일괄 조회: 1개
  - 모든 댓글의 답글 수 일괄 조회: 1개

**결과: 약 93% 쿼리 감소, 응답 속도 대폭 개선** 🚀

---

## 🔄 변경된 파일 목록

### 1. 데이터베이스
- ✅ `supabase/migrations/20260210_improve_comment_likes.sql` (신규)

### 2. API 엔드포인트
- ✅ `app/api/recipes/[id]/comments/[commentId]/like/route.ts` (수정)
- ✅ `app/api/recipes/[id]/comments/route.ts` (수정)
- ✅ `app/api/recipes/[id]/comments/[commentId]/replies/route.ts` (수정)

### 3. 프론트엔드
- ℹ️ 프론트엔드 코드는 변경 없음 (API 호환성 유지)

---

## 🔍 주요 변경 사항 상세

### 1. 데이터베이스 트리거

```sql
-- 트리거 함수: comment_likes 테이블 변경 시 자동으로 likes_count 업데이트
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipe_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipe_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**효과:**
- 수동 카운트 업데이트 불필요
- 데이터 일관성 자동 보장
- 동시성 문제 해결

### 2. RPC 함수 (트랜잭션 안전)

```sql
-- 댓글 좋아요 토글 (원자적 처리)
CREATE OR REPLACE FUNCTION toggle_comment_like(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
-- ... 트랜잭션 내에서 안전하게 처리
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**효과:**
- 트랜잭션 안전성 확보
- Race Condition 방지
- 에러 처리 개선

### 3. N+1 쿼리 해결

**변경 전:**
```typescript
// 각 댓글마다 반복 쿼리 (N+1 문제)
const commentsWithReplies = await Promise.all(
  comments.map(async (comment) => {
    // 좋아요 여부 쿼리
    const { data: like } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', comment.id)
      .eq('user_id', user.id)
      .maybeSingle();
    // ...
  })
);
```

**변경 후:**
```typescript
// 일괄 조회 (단일 쿼리)
const commentIds = comments.map(c => c.id);

// 모든 댓글의 좋아요를 한 번에 조회
const { data: likes } = await supabase
  .from('comment_likes')
  .select('comment_id')
  .in('comment_id', commentIds)
  .eq('user_id', user.id);

// Map으로 빠르게 매칭
const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
```

**효과:**
- 쿼리 수 대폭 감소
- 응답 속도 개선
- 데이터베이스 부하 감소

---

## ⚠️ 주의사항

### 1. 기존 데이터 정합성
- 마이그레이션 실행 시 기존 데이터의 `likes_count`를 자동으로 재계산합니다
- 데이터가 많은 경우 시간이 걸릴 수 있습니다 (몇 초 ~ 몇 분)

### 2. 프론트엔드 호환성
- API 응답 형식은 그대로 유지되므로 프론트엔드 코드 변경 불필요
- 기존 기능이 그대로 작동합니다

### 3. 롤백 시나리오
만약 문제가 발생하면 다음 SQL로 롤백할 수 있습니다:

```sql
-- 트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_comment_likes ON comment_likes;
DROP FUNCTION IF EXISTS update_comment_likes_count();

-- RPC 함수 삭제
DROP FUNCTION IF EXISTS toggle_comment_like(UUID, UUID);
```

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] 마이그레이션 파일이 Supabase에 성공적으로 적용되었는가?
- [ ] 트리거가 정상적으로 작동하는가? (테스트 완료)
- [ ] RPC 함수가 정상적으로 작동하는가? (테스트 완료)
- [ ] 댓글 좋아요 기능이 정상적으로 작동하는가? (UI 테스트 완료)
- [ ] 댓글 목록 조회 속도가 개선되었는가? (성능 테스트 완료)
- [ ] 기존 좋아요 데이터가 유지되는가?

---

## 📞 문제 발생 시

문제가 발생하면 다음을 확인하세요:

1. **마이그레이션 실행 오류**
   - Supabase SQL Editor에서 오류 메시지 확인
   - 데이터베이스 권한 확인

2. **API 오류**
   - 브라우저 콘솔에서 네트워크 탭 확인
   - 서버 로그 확인 (`npm run dev` 터미널)

3. **좋아요가 작동하지 않음**
   - 로그인 상태 확인
   - RPC 함수 권한 확인: `GRANT EXECUTE ON FUNCTION toggle_comment_like(UUID, UUID) TO authenticated;`

---

## 📚 참고 자료

- [Supabase Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)

---

**작성일**: 2026-02-10
**버전**: 1.0.0
