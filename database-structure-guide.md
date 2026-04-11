# 낼름 Supabase 데이터베이스 구조 설명서

## 📊 데이터베이스 개요

이 문서는 낼름(Naelum) 레시피 공유 플랫폼의 Supabase PostgreSQL 데이터베이스 구조를 설명합니다.

---

## 🗂️ 테이블 그룹 구조

### 1. 사용자 & 인증 (Users & Authentication)
```
├── profiles (사용자 프로필)
├── user_interests (관심사)
├── user_dietary_preferences (식단 선호도)
├── user_allergies (알레르기 정보)
└── user_follows (팔로우 관계)
```

### 2. 레시피 (Recipes)
```
├── recipes (레시피 메인)
├── recipe_ingredients (재료 목록)
├── recipe_steps (조리 단계)
├── recipe_tags (태그)
├── recipe_notes (팁/주의사항)
└── recipe_folders (저장 폴더)
```

### 3. 소셜 기능 (Social Features)
```
├── recipe_likes (좋아요)
├── recipe_saves (저장/북마크)
├── recipe_comments (댓글)
├── comment_likes (댓글 좋아요)
└── recipe_ratings (평점)
```

### 4. 재료 관리 (Ingredients)
```
├── ingredients_master (마스터 재료 DB)
└── user_ingredients (보유 재료)
```

### 5. 검색 & 추천 (Search & Recommendations)
```
├── search_history (검색 기록)
├── trending_searches (인기 검색어)
└── recommendation_history (추천 기록)
```

### 6. 요리 활동 (Cooking Activity)
```
├── cooking_sessions (요리 완료 기록)
├── meal_plans (식단 계획)
├── meal_plan_items (식단 상세)
├── shopping_lists (장보기 리스트)
└── shopping_list_items (장보기 아이템)
```

### 7. 시스템 (System)
```
├── notifications (알림)
├── reports (신고)
├── recipe_views (조회 이력)
├── daily_stats (일별 통계)
├── system_settings (시스템 설정)
└── translations (다국어)
```

---

## 📋 주요 테이블 상세 설명

### 1. profiles (사용자 프로필)

**목적**: Supabase Auth와 연동된 사용자 프로필 정보 저장

**주요 컬럼**:
- `id` (UUID, PK): Supabase Auth의 user ID와 동일
- `username` (VARCHAR): 고유 사용자명 (/@username 형식)
- `email` (VARCHAR): 이메일 주소
- `avatar_url` (TEXT): 프로필 이미지 URL
- `onboarding_completed` (BOOLEAN): 온보딩 완료 여부
- `followers_count` / `following_count`: 팔로워/팔로잉 수
- `recipes_count`: 작성한 레시피 수

**인덱스**:
- `username`, `email`: 빠른 조회
- `search_vector`: 전문 검색 (tsvector)

**관계**:
- `recipes` (1:N): 한 사용자는 여러 레시피 작성
- `user_ingredients` (1:N): 보유 재료 관리
- `user_follows` (N:N): 자기 참조 팔로우 관계

---

### 2. recipes (레시피)

**목적**: 레시피의 핵심 정보 저장

**주요 컬럼**:
- `id` (UUID, PK): 레시피 고유 ID
- `author_id` (UUID, FK): 작성자 ID
- `title` (VARCHAR): 레시피 제목
- `description` (TEXT): 상세 설명
- `thumbnail_url` / `video_url`: 썸네일/비디오
- `servings` (INTEGER): 인분 수
- `prep_time_minutes` / `cook_time_minutes`: 준비/조리 시간
- `total_time_minutes` (GENERATED): 총 시간 (자동 계산)
- `difficulty_level` (VARCHAR): 난이도 (easy/medium/hard)
- `cuisine_type` / `dish_type` / `meal_type`: 요리 분류
- `calories` / `protein_grams` / `carbs_grams` / `fat_grams`: 영양 정보
- `is_vegetarian` / `is_vegan` / `is_gluten_free`: 식단 태그
- `likes_count` / `saves_count` / `views_count`: 통계 (자동 업데이트)
- `average_rating` / `ratings_count`: 평균 평점
- `original_recipe_id` / `is_remix`: 리믹스 관계
- `is_published` / `is_featured`: 공개/추천 여부
- `search_vector` (tsvector): 전문 검색용

**인덱스**:
- `author_id`: 작성자별 레시피 조회
- `cuisine_type`, `dish_type`: 카테고리 필터
- `published_at`, `likes_count`, `average_rating`: 정렬/랭킹
- `search_vector`: 전문 검색
- 복합 인덱스: `(is_published, cuisine_type)`, `(is_published, average_rating DESC)`

**관계**:
- `profiles` (N:1): 작성자
- `recipe_ingredients` (1:N): 재료 목록
- `recipe_steps` (1:N): 조리 단계
- `recipe_likes` (1:N): 좋아요
- `recipe_saves` (1:N): 저장
- `recipe_comments` (1:N): 댓글

**트리거**:
- `update_updated_at`: 수정 시 자동으로 updated_at 갱신

---

### 3. recipe_ingredients (재료)

**목적**: 레시피에 필요한 재료 목록

**주요 컬럼**:
- `recipe_id` (UUID, FK): 레시피 ID
- `ingredient_name` (VARCHAR): 재료명
- `ingredient_category` (VARCHAR): 카테고리 (채소/육류/해산물 등)
- `quantity` (DECIMAL): 양
- `unit` (VARCHAR): 단위 (g/ml/cup/개 등)
- `notes` (TEXT): 추가 설명 ("잘게 썬", "굵게 다진")
- `is_optional` (BOOLEAN): 선택적 재료 여부
- `substitutes` (JSONB): 대체 재료 목록
- `display_order` (INTEGER): 표시 순서

**JSONB 예시**:
```json
{
  "substitutes": [
    {"name": "두부", "quantity": 200, "unit": "g", "note": "닭고기 대신"},
    {"name": "콩고기", "quantity": 150, "unit": "g"}
  ]
}
```

---

### 4. recipe_steps (조리 단계)

**목적**: 레시피의 단계별 조리 과정

**주요 컬럼**:
- `recipe_id` (UUID, FK)
- `step_number` (INTEGER): 단계 번호
- `title` (VARCHAR): 단계 제목 (선택)
- `instruction` (TEXT): 조리 방법
- `image_url` / `video_url`: 단계별 미디어
- `timer_minutes` (INTEGER): 타이머 설정
- `temperature_celsius` (INTEGER): 온도
- `tip` (TEXT): 팁

**정렬**: `(recipe_id, step_number)` 복합 인덱스로 순서 보장

---

### 5. recipe_likes (좋아요)

**목적**: 레시피 좋아요 기록

**제약조건**:
- `UNIQUE(recipe_id, user_id)`: 중복 좋아요 방지

**트리거**:
- INSERT 시: `recipes.likes_count` +1
- DELETE 시: `recipes.likes_count` -1

---

### 6. recipe_saves (저장/북마크)

**목적**: 레시피 저장 및 폴더 관리

**주요 컬럼**:
- `folder_id` (UUID, FK): 저장 폴더 (NULL 가능)
- `notes` (TEXT): 개인 메모

**관계**:
- `recipe_folders` (N:1): 폴더로 분류 가능

---

### 7. recipe_comments (댓글)

**목적**: 레시피 댓글 및 대댓글

**주요 컬럼**:
- `parent_comment_id` (UUID, FK): 대댓글용 (NULL이면 최상위)
- `content` (TEXT): 댓글 내용
- `image_url` (TEXT): 만든 후기 사진
- `likes_count` (INTEGER): 댓글 좋아요 수
- `is_edited` / `is_deleted`: 수정/삭제 여부

**트리거**:
- INSERT/DELETE 시 `recipes.comments_count` 자동 업데이트

---

### 8. recipe_ratings (평점)

**목적**: 레시피 평점 및 리뷰

**주요 컬럼**:
- `rating` (INTEGER): 1~5점
- `review` (TEXT): 리뷰 (선택)

**제약조건**:
- `UNIQUE(recipe_id, user_id)`: 중복 평점 방지
- `CHECK (rating >= 1 AND rating <= 5)`

**트리거**:
- INSERT/UPDATE/DELETE 시 `recipes.average_rating` 자동 계산

---

### 9. ingredients_master (마스터 재료 DB)

**목적**: 재료 자동완성 및 표준화

**주요 컬럼**:
- `name` (VARCHAR, UNIQUE): 표준 재료명
- `name_en` / `name_ko`: 다국어 이름
- `category` / `subcategory`: 카테고리
- `calories_per_100g` / `protein_per_100g` 등: 영양 정보
- `common_units` (JSONB): 일반적인 단위 목록
- `substitutes` (JSONB): 대체 재료
- `search_count` (INTEGER): 검색 횟수 (인기도)

**JSONB 예시**:
```json
{
  "common_units": ["g", "ml", "cup", "개"],
  "substitutes": [
    {"name": "두부", "ratio": 1.0},
    {"name": "템페", "ratio": 0.8}
  ]
}
```

---

### 10. user_ingredients (보유 재료)

**목적**: 사용자가 현재 보유한 재료 관리

**주요 컬럼**:
- `ingredient_id` (UUID, FK): 마스터 DB 참조 (NULL 가능)
- `ingredient_name` (VARCHAR): 재료명 (마스터에 없을 수도 있음)
- `quantity` / `unit`: 양과 단위
- `purchase_date` / `expiry_date`: 구매일/유통기한
- `storage_location` (VARCHAR): 보관 장소 (냉장/냉동/상온)
- `expiry_alert` (BOOLEAN): 유통기한 알림

**활용**:
- 재료 기반 레시피 추천
- 유통기한 알림
- 장보기 리스트 자동 생성

---

### 11. user_follows (팔로우)

**목적**: 사용자 간 팔로우 관계

**제약조건**:
- `UNIQUE(follower_id, following_id)`: 중복 팔로우 방지
- `CHECK (follower_id != following_id)`: 자기 자신 팔로우 방지

**트리거**:
- INSERT 시:
  - `profiles.following_count` +1 (팔로워)
  - `profiles.followers_count` +1 (팔로잉)
- DELETE 시: 반대

---

### 12. cooking_sessions (요리 완료 기록)

**목적**: 사용자가 요리를 완료한 기록

**주요 컬럼**:
- `started_at` / `completed_at`: 시작/완료 시간
- `total_time_minutes`: 실제 소요 시간
- `difficulty_rating` / `taste_rating`: 난이도/맛 평가
- `would_cook_again` (BOOLEAN): 다시 만들 의향
- `notes` / `photo_url`: 메모/사진
- `modifications` (JSONB): 레시피 수정 내용

**활용**:
- 개인 요리 통계
- AI 추천 시스템 학습 데이터

---

### 13. shopping_lists (장보기 리스트)

**목적**: 장보기 리스트 관리

**주요 컬럼**:
- `list_name` (VARCHAR): 리스트 이름
- `is_active` (BOOLEAN): 활성 상태
- `total_items` / `completed_items`: 전체/완료 아이템 수

**관계**:
- `shopping_list_items` (1:N): 아이템 목록

---

### 14. shopping_list_items (장보기 아이템)

**목적**: 장보기 리스트의 개별 아이템

**주요 컬럼**:
- `recipe_id` (UUID, FK): 어떤 레시피를 위한 재료인지 (선택)
- `ingredient_name` / `quantity` / `unit`: 재료 정보
- `is_checked` (BOOLEAN): 체크 여부
- `estimated_price` (DECIMAL): 예상 가격

**활용**:
- 레시피에서 자동 생성
- 마트별 재료 위치 안내 (향후 제휴 시)
- 온라인 장보기 연동

---

### 15. meal_plans (식단 계획)

**목적**: 주간/월간 식단 계획

**주요 컬럼**:
- `plan_name` (VARCHAR): 계획 이름
- `start_date` / `end_date`: 기간
- `is_active` (BOOLEAN): 활성 상태

**관계**:
- `meal_plan_items` (1:N): 일별 식사 계획

---

### 16. meal_plan_items (식단 상세)

**목적**: 식단 계획의 일별 식사

**주요 컬럼**:
- `planned_date` (DATE): 계획일
- `meal_type` (VARCHAR): 식사 시간 (breakfast/lunch/dinner/snack)
- `recipe_id` (UUID, FK): 레시피
- `servings` (INTEGER): 인분 수
- `is_completed` (BOOLEAN): 완료 여부

**활용**:
- 주간 식단 관리
- 장보기 리스트 자동 생성
- 영양 섭취 트래킹

---

### 17. notifications (알림)

**목적**: 사용자 알림 관리

**주요 컬럼**:
- `notification_type` (VARCHAR): 알림 유형
  - `like`: 좋아요
  - `comment`: 댓글
  - `follow`: 팔로우
  - `meal_time`: 식사 시간
  - `expiry`: 유통기한 임박
- `title` / `message`: 제목/내용
- `related_user_id` / `related_recipe_id` / `related_comment_id`: 관련 엔티티
- `action_url` (TEXT): 클릭 시 이동 URL
- `is_read` (BOOLEAN): 읽음 여부

**인덱스**:
- `(user_id, is_read)`: 읽지 않은 알림 빠른 조회
- 부분 인덱스: `WHERE is_read = false`

---

### 18. search_history (검색 기록)

**목적**: 사용자 검색 기록 및 분석

**주요 컬럼**:
- `search_query` (VARCHAR): 검색어
- `search_type` (VARCHAR): 검색 유형
- `result_count` (INTEGER): 결과 수
- `clicked_result_id` (UUID): 클릭한 결과

**활용**:
- 최근 검색어 표시
- 검색 추천
- 사용자 행동 분석

---

### 19. trending_searches (인기 검색어)

**목적**: 인기 검색어 집계

**주요 컬럼**:
- `search_query` (VARCHAR, UNIQUE)
- `search_count` (INTEGER): 총 검색 횟수
- `week_count` / `month_count`: 주간/월간 횟수

**업데이트 방식**:
- Batch job으로 주기적 집계
- 또는 `search_history` 트리거

---

### 20. recipe_views (조회 기록)

**목적**: 레시피 조회 상세 분석

**주요 컬럼**:
- `session_id` / `ip_address` / `user_agent`: 세션 정보
- `referrer` / `source`: 유입 경로
- `view_duration_seconds`: 조회 시간

**활용**:
- 인기 레시피 분석
- 추천 시스템 개선
- 마케팅 분석

---

### 21. daily_stats (일별 통계)

**목적**: 일별 집계 데이터 (성능 최적화)

**주요 컬럼**:
- `stat_date` (DATE, UNIQUE): 날짜
- `total_users` / `new_users` / `active_users`: 사용자 통계
- `total_recipes` / `new_recipes`: 레시피 통계
- `total_views` / `total_likes` / `total_saves`: 활동 통계

**업데이트 방식**:
- Daily cron job으로 집계

---

## 🔒 Row Level Security (RLS) 정책

Supabase는 PostgreSQL의 RLS를 활용하여 데이터 보안을 강화합니다.

### 적용된 RLS 정책:

#### 1. profiles
- ✅ **SELECT**: 모든 사람이 프로필 조회 가능
- ✅ **UPDATE**: 본인만 수정 가능

#### 2. recipes
- ✅ **SELECT**: 공개(`is_published = true`)된 레시피는 모두 조회, 비공개는 작성자만
- ✅ **INSERT**: 인증된 사용자만 작성 가능
- ✅ **UPDATE/DELETE**: 작성자만 가능

#### 3. recipe_comments
- ✅ **SELECT**: 모든 사람이 조회 가능
- ✅ **INSERT**: 인증된 사용자만 작성 가능
- ✅ **UPDATE/DELETE**: 본인만 수정/삭제

#### 4. recipe_likes, recipe_saves
- ✅ **ALL**: 본인 것만 관리 가능

#### 5. user_ingredients
- ✅ **ALL**: 본인 것만 관리 가능

#### 6. notifications
- ✅ **SELECT/UPDATE**: 본인 것만 조회/수정

---

## 🔄 자동화된 트리거 (Triggers)

### 1. 통계 카운트 자동 업데이트

#### `recipes.likes_count`
```sql
-- recipe_likes 테이블에 INSERT/DELETE 시 자동 +1/-1
CREATE TRIGGER trigger_update_recipe_likes
  AFTER INSERT OR DELETE ON recipe_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_likes_count();
```

#### `recipes.saves_count`
```sql
-- recipe_saves 테이블에 INSERT/DELETE 시 자동 +1/-1
CREATE TRIGGER trigger_update_recipe_saves
  AFTER INSERT OR DELETE ON recipe_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_saves_count();
```

#### `recipes.comments_count`
```sql
-- recipe_comments 테이블에 INSERT/DELETE 시 자동 +1/-1
CREATE TRIGGER trigger_update_recipe_comments
  AFTER INSERT OR DELETE ON recipe_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_comments_count();
```

#### `profiles.followers_count` / `following_count`
```sql
-- user_follows 테이블에 INSERT/DELETE 시 자동 업데이트
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();
```

### 2. 평균 평점 자동 계산

```sql
-- recipe_ratings 테이블에 INSERT/UPDATE/DELETE 시
-- recipes.average_rating 자동 계산
CREATE TRIGGER trigger_update_recipe_rating
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_rating();
```

### 3. 타임스탬프 자동 업데이트

```sql
-- UPDATE 시 updated_at 자동 갱신
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔍 전문 검색 (Full-Text Search)

### tsvector를 활용한 검색

#### profiles 테이블
```sql
search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, ''))
) STORED
```

#### recipes 테이블
```sql
search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED
```

### 검색 쿼리 예시
```sql
-- 레시피 검색
SELECT * FROM recipes
WHERE search_vector @@ to_tsquery('english', 'pasta & tomato')
ORDER BY ts_rank(search_vector, to_tsquery('english', 'pasta & tomato')) DESC;

-- 사용자 검색
SELECT * FROM profiles
WHERE search_vector @@ to_tsquery('english', 'john')
ORDER BY ts_rank(search_vector, to_tsquery('english', 'john')) DESC;
```

---

## 📊 유용한 뷰 (Views)

### 1. popular_recipes (인기 레시피)
```sql
CREATE VIEW popular_recipes AS
SELECT 
  r.*,
  p.username AS author_username,
  p.avatar_url AS author_avatar
FROM recipes r
JOIN profiles p ON r.author_id = p.id
WHERE r.is_published = true
ORDER BY 
  (r.likes_count * 2 + r.saves_count * 3 + r.views_count * 0.1 + r.average_rating * 10) DESC;
```

**활용**:
- 인기 레시피 페이지
- 메인 페이지 추천
- 트렌딩 레시피

### 2. user_activity_summary (사용자 활동 요약)
```sql
CREATE VIEW user_activity_summary AS
SELECT 
  p.id,
  p.username,
  COUNT(DISTINCT r.id) AS recipes_created,
  COUNT(DISTINCT rl.id) AS recipes_liked,
  COUNT(DISTINCT rs.id) AS recipes_saved,
  COUNT(DISTINCT rc.id) AS comments_made,
  COUNT(DISTINCT cs.id) AS recipes_cooked
FROM profiles p
LEFT JOIN recipes r ON p.id = r.author_id
LEFT JOIN recipe_likes rl ON p.id = rl.user_id
LEFT JOIN recipe_saves rs ON p.id = rs.user_id
LEFT JOIN recipe_comments rc ON p.id = rc.user_id
LEFT JOIN cooking_sessions cs ON p.id = cs.user_id
GROUP BY p.id, p.username;
```

**활용**:
- 프로필 페이지 통계
- 사용자 랭킹
- 활동 분석

---

## 🔗 주요 관계 (Relationships)

### 1:N 관계

```
profiles (1) ──→ (N) recipes
profiles (1) ──→ (N) user_ingredients
profiles (1) ──→ (N) notifications
recipes (1) ──→ (N) recipe_ingredients
recipes (1) ──→ (N) recipe_steps
recipes (1) ──→ (N) recipe_likes
recipes (1) ──→ (N) recipe_saves
recipes (1) ──→ (N) recipe_comments
```

### N:N 관계 (조인 테이블)

```
profiles ←→ (user_follows) ←→ profiles  [팔로우]
profiles ←→ (recipe_likes) ←→ recipes    [좋아요]
profiles ←→ (recipe_saves) ←→ recipes    [저장]
```

### 자기 참조 관계

```
recipe_comments (parent_comment_id) ──→ recipe_comments  [대댓글]
recipes (original_recipe_id) ──→ recipes  [리믹스]
user_follows (follower_id, following_id) ──→ profiles  [팔로우]
```

---

## 📈 성능 최적화 전략

### 1. 인덱스 전략

#### 단일 컬럼 인덱스
- 자주 WHERE 절에 사용되는 컬럼
- 외래 키 (자동 생성)
- 정렬에 사용되는 컬럼 (`created_at DESC`)

#### 복합 인덱스
```sql
-- 자주 함께 쿼리되는 컬럼들
CREATE INDEX idx_recipes_published_cuisine 
  ON recipes(is_published, cuisine_type) 
  WHERE is_published = true;

CREATE INDEX idx_recipes_author_published 
  ON recipes(author_id, is_published, created_at DESC);
```

#### 부분 인덱스 (Partial Index)
```sql
-- 특정 조건에만 인덱스 적용 (공간 절약)
CREATE INDEX idx_recipes_featured 
  ON recipes(id) 
  WHERE is_featured = true;

CREATE INDEX idx_notifications_unread 
  ON notifications(user_id, created_at DESC) 
  WHERE is_read = false;
```

#### JSONB 인덱스
```sql
-- JSONB 컬럼 검색 최적화
CREATE INDEX idx_ingredients_common_units 
  ON ingredients_master USING GIN(common_units);
```

### 2. 계산된 컬럼 (Generated Columns)

```sql
-- 자주 계산하는 값은 미리 저장
total_time_minutes INTEGER GENERATED ALWAYS AS 
  (prep_time_minutes + cook_time_minutes) STORED
```

### 3. 집계 테이블

```sql
-- 실시간 집계 대신 일별 집계 사용
daily_stats  -- 일일 배치로 업데이트
trending_searches  -- 주기적 집계
```

### 4. 카운터 캐싱

```sql
-- 조인 없이 카운트 조회
recipes.likes_count  -- recipe_likes 테이블 카운트 캐싱
profiles.followers_count  -- user_follows 테이블 카운트 캐싱
```

---

## 🚀 API 활용 예시 (Next.js + Supabase)

### 1. 레시피 목록 조회
```typescript
const { data: recipes, error } = await supabase
  .from('recipes')
  .select(`
    *,
    author:profiles(username, avatar_url),
    likes:recipe_likes(count),
    saves:recipe_saves(count)
  `)
  .eq('is_published', true)
  .order('created_at', { ascending: false })
  .range(0, 9);
```

### 2. 재료 기반 레시피 추천
```typescript
const userIngredients = ['닭고기', '양파', '마늘'];

const { data: recipes } = await supabase
  .rpc('find_recipes_by_ingredients', {
    ingredient_names: userIngredients
  });
```

### 3. 레시피 상세 조회 (관계 포함)
```typescript
const { data: recipe } = await supabase
  .from('recipes')
  .select(`
    *,
    author:profiles(username, avatar_url, followers_count),
    ingredients:recipe_ingredients(*),
    steps:recipe_steps(*).order('step_number'),
    tags:recipe_tags(*),
    comments:recipe_comments(
      *,
      user:profiles(username, avatar_url)
    ).order('created_at', { ascending: false })
  `)
  .eq('id', recipeId)
  .single();
```

### 4. 레시피 좋아요 토글
```typescript
const toggleLike = async (recipeId: string, userId: string) => {
  const { data: existing } = await supabase
    .from('recipe_likes')
    .select('id')
    .eq('recipe_id', recipeId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // 좋아요 취소
    await supabase
      .from('recipe_likes')
      .delete()
      .eq('id', existing.id);
  } else {
    // 좋아요 추가
    await supabase
      .from('recipe_likes')
      .insert({ recipe_id: recipeId, user_id: userId });
  }
};
```

### 5. 실시간 구독 (알림)
```typescript
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('새 알림:', payload.new);
      // UI 업데이트
    }
  )
  .subscribe();
```

---

## 🛠️ 설치 및 설정 가이드

### 1. Supabase 프로젝트 생성
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력

### 2. 스키마 적용
1. Supabase Dashboard → SQL Editor
2. `supabase-schema.sql` 파일 내용 복사
3. "Run" 클릭

### 3. Storage 설정 (이미지/비디오)
```sql
-- Storage Buckets 생성
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('recipe-images', 'recipe-images', true),
  ('recipe-videos', 'recipe-videos', true);

-- Storage Policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

### 4. Authentication 설정
1. Supabase Dashboard → Authentication → Providers
2. Google OAuth 활성화
3. Redirect URLs 설정:
   - `http://localhost:3000/auth/callback` (개발)
   - `https://yourdomain.com/auth/callback` (프로덕션)

### 5. Environment Variables (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📝 TODO & 추후 개선사항

### Phase 1 (MVP)
- [ ] 기본 CRUD API 구현
- [ ] 사용자 인증 통합
- [ ] 레시피 검색 최적화
- [ ] 이미지 업로드 구현

### Phase 2 (핵심 기능)
- [ ] 재료 기반 추천 알고리즘
- [ ] 실시간 알림 시스템
- [ ] 식단 플래너 구현
- [ ] 장보기 리스트 자동 생성

### Phase 3 (고급 기능)
- [ ] AI 추천 시스템 (머신러닝)
- [ ] 이미지 인식 (재료 자동 감지)
- [ ] 음성 제어 API
- [ ] 다국어 자동 번역

### 성능 최적화
- [ ] Redis 캐싱 레이어 추가
- [ ] CDN 설정 (이미지/비디오)
- [ ] Database 커넥션 풀링
- [ ] 쿼리 성능 모니터링

---

## 🔍 추가 리소스

### Supabase 공식 문서
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Functions](https://supabase.com/docs/guides/database/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Next.js 통합
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**문서 작성일**: 2026-02-02  
**버전**: 1.0.0  
**작성자**: 낼름 개발팀
