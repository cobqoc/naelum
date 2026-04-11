-- ================================================
-- 낼름 (Naelum) Supabase Database Schema
-- 레시피 공유 웹앱 데이터베이스 구조
-- Version: 1.0.0
-- Created: 2026-02-02
-- ================================================

-- ================================================
-- 1. USERS & AUTHENTICATION
-- ================================================

-- 사용자 프로필 테이블 (Supabase Auth와 연동)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  birth_date DATE,
  gender VARCHAR(20),
  
  -- 온보딩 관련
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  -- 통계
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  recipes_count INTEGER DEFAULT 0,

  -- 알림 설정
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  meal_time_notifications BOOLEAN DEFAULT FALSE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- 인덱스용 컬럼
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, ''))
  ) STORED
);

-- 프로필 인덱스
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_search ON profiles USING GIN(search_vector);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- 자동 업데이트 타임스탬프 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 2. USER PREFERENCES & ONBOARDING
-- ================================================

-- 사용자 관심사 (온보딩)
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_type VARCHAR(50) NOT NULL, -- 'cuisine', 'dish_type', 'diet_type'
  interest_value VARCHAR(100) NOT NULL, -- '한식', '디저트', '비건' 등
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_type ON user_interests(interest_type);

-- 사용자 식단 선호도
CREATE TABLE user_dietary_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL, -- 'vegetarian', 'vegan', 'gluten_free' 등
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dietary_prefs_user_id ON user_dietary_preferences(user_id);

-- 사용자 알레르기 정보
CREATE TABLE user_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'moderate', -- 'mild', 'moderate', 'severe'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_allergies_user_id ON user_allergies(user_id);

-- ================================================
-- 3. RECIPES
-- ================================================

-- 레시피 메인 테이블
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  
  -- 요리 정보
  servings INTEGER DEFAULT 1,
  prep_time_minutes INTEGER, -- 준비 시간
  cook_time_minutes INTEGER, -- 조리 시간
  total_time_minutes INTEGER GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
  difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  
  -- 분류
  cuisine_type VARCHAR(50), -- '한식', '중식', '일식', '양식' 등
  dish_type VARCHAR(50), -- '메인', '사이드', '디저트', '음료' 등
  meal_type VARCHAR(50), -- '아침', '점심', '저녁', '간식' 등
  
  -- 영양 정보
  calories INTEGER,
  protein_grams DECIMAL(10,2),
  carbs_grams DECIMAL(10,2),
  fat_grams DECIMAL(10,2),
  fiber_grams DECIMAL(10,2),
  
  -- 식단 태그
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_dairy_free BOOLEAN DEFAULT FALSE,
  is_low_carb BOOLEAN DEFAULT FALSE,
  
  -- 소셜 통계
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  ratings_count INTEGER DEFAULT 0,
  
  -- 원본 레시피 (리믹스인 경우)
  original_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  is_remix BOOLEAN DEFAULT FALSE,
  
  -- 공개 설정
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- 관리자가 추천하는 레시피
  
  -- 타임스탬프
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 전문 검색용
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED
);

-- 레시피 인덱스
CREATE INDEX idx_recipes_author_id ON recipes(author_id);
CREATE INDEX idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX idx_recipes_dish_type ON recipes(dish_type);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty_level);
CREATE INDEX idx_recipes_published_at ON recipes(published_at DESC NULLS LAST);
CREATE INDEX idx_recipes_likes ON recipes(likes_count DESC);
CREATE INDEX idx_recipes_rating ON recipes(average_rating DESC);
CREATE INDEX idx_recipes_search ON recipes USING GIN(search_vector);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_total_time ON recipes(total_time_minutes);

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. RECIPE CONTENT
-- ================================================

-- 레시피 재료
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- 재료 정보
  ingredient_name VARCHAR(100) NOT NULL,
  ingredient_category VARCHAR(50), -- '채소', '육류', '해산물', '유제품' 등
  quantity DECIMAL(10,2),
  unit VARCHAR(50), -- 'g', 'ml', 'cup', 'tbsp', '개' 등
  notes TEXT, -- 추가 설명 (예: "잘게 썬", "굵게 다진")
  
  -- 재료 대체 옵션
  is_optional BOOLEAN DEFAULT FALSE,
  substitutes JSONB, -- 대체 가능한 재료 목록 [{"name": "두부", "quantity": 200, "unit": "g"}]
  
  -- 순서
  display_order INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(ingredient_name);
CREATE INDEX idx_recipe_ingredients_category ON recipe_ingredients(ingredient_category);

-- 레시피 조리 단계
CREATE TABLE recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- 단계 정보
  step_number INTEGER NOT NULL,
  title VARCHAR(200), -- 단계 제목 (선택)
  instruction TEXT NOT NULL,
  
  -- 미디어
  image_url TEXT,
  video_url TEXT,
  
  -- 타이머 설정
  timer_minutes INTEGER,
  temperature_celsius INTEGER,
  
  -- 팁
  tip TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_steps_order ON recipe_steps(recipe_id, step_number);

-- 레시피 태그
CREATE TABLE recipe_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(recipe_id, tag_name)
);

CREATE INDEX idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_name ON recipe_tags(tag_name);

-- 레시피 팁 및 주의사항
CREATE TABLE recipe_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  note_type VARCHAR(20) NOT NULL, -- 'tip', 'warning', 'info'
  content TEXT NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_notes_recipe_id ON recipe_notes(recipe_id);

-- ================================================
-- 5. SOCIAL FEATURES
-- ================================================

-- 레시피 좋아요
CREATE TABLE recipe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX idx_recipe_likes_recipe_id ON recipe_likes(recipe_id);
CREATE INDEX idx_recipe_likes_user_id ON recipe_likes(user_id);
CREATE INDEX idx_recipe_likes_created_at ON recipe_likes(created_at DESC);

-- 저장된 레시피 폴더 (recipe_saves보다 먼저 생성)
CREATE TABLE recipe_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- HEX 색상 코드
  icon VARCHAR(50),
  is_default BOOLEAN DEFAULT FALSE,
  recipes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_folders_user_id ON recipe_folders(user_id);

CREATE TRIGGER update_recipe_folders_updated_at
  BEFORE UPDATE ON recipe_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 레시피 저장/북마크
CREATE TABLE recipe_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES recipe_folders(id) ON DELETE SET NULL,
  notes TEXT, -- 개인 메모
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX idx_recipe_saves_recipe_id ON recipe_saves(recipe_id);
CREATE INDEX idx_recipe_saves_user_id ON recipe_saves(user_id);
CREATE INDEX idx_recipe_saves_folder_id ON recipe_saves(folder_id);

-- 레시피 댓글
CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES recipe_comments(id) ON DELETE CASCADE, -- 대댓글
  
  content TEXT NOT NULL,
  image_url TEXT, -- 만든 후기 사진
  
  -- 통계
  likes_count INTEGER DEFAULT 0,
  
  -- 수정/삭제
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);
CREATE INDEX idx_recipe_comments_user_id ON recipe_comments(user_id);
CREATE INDEX idx_recipe_comments_parent_id ON recipe_comments(parent_comment_id);
CREATE INDEX idx_recipe_comments_created_at ON recipe_comments(created_at DESC);

-- 댓글 좋아요
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES recipe_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);

-- 레시피 평점
CREATE TABLE recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user_id ON recipe_ratings(user_id);

-- 팔로우 관계
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

-- ================================================
-- 6. INGREDIENTS MANAGEMENT
-- ================================================

-- 마스터 재료 목록 (자동완성 및 표준화)
CREATE TABLE ingredients_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100),
  name_ko VARCHAR(100),
  category VARCHAR(50), -- '채소', '육류', '해산물', '곡물', '유제품' 등
  subcategory VARCHAR(50),
  
  -- 영양 정보 (100g 당)
  calories_per_100g INTEGER,
  protein_per_100g DECIMAL(10,2),
  carbs_per_100g DECIMAL(10,2),
  fat_per_100g DECIMAL(10,2),
  
  -- 이미지
  image_url TEXT,
  
  -- 일반적인 단위
  common_units JSONB, -- ["g", "ml", "cup", "개"]
  
  -- 대체 재료
  substitutes JSONB, -- [{"name": "두부", "ratio": 1.0}]
  
  -- 검색 최적화
  search_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingredients_master_name ON ingredients_master(name);
CREATE INDEX idx_ingredients_master_category ON ingredients_master(category);
CREATE INDEX idx_ingredients_master_search_count ON ingredients_master(search_count DESC);

-- 사용자 보유 재료
CREATE TABLE user_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients_master(id) ON DELETE SET NULL,
  ingredient_name VARCHAR(100) NOT NULL, -- 마스터 목록에 없을 수도 있음
  
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  
  -- 구매/유통기한
  purchase_date DATE,
  expiry_date DATE,
  
  -- 위치
  storage_location VARCHAR(50), -- '냉장', '냉동', '상온' 등
  
  -- 알림
  low_stock_alert BOOLEAN DEFAULT FALSE,
  expiry_alert BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_ingredients_user_id ON user_ingredients(user_id);
CREATE INDEX idx_user_ingredients_name ON user_ingredients(ingredient_name);
CREATE INDEX idx_user_ingredients_expiry ON user_ingredients(expiry_date);

-- ================================================
-- 7. SEARCH & RECOMMENDATIONS
-- ================================================

-- 검색 히스토리
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  search_query VARCHAR(200) NOT NULL,
  search_type VARCHAR(50), -- 'recipe', 'ingredient', 'user', 'unified'
  result_count INTEGER,
  clicked_result_id UUID, -- 클릭한 결과의 ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_query ON search_history(search_query);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- 인기 검색어 (집계 테이블)
CREATE TABLE trending_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query VARCHAR(200) UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),
  week_count INTEGER DEFAULT 0,
  month_count INTEGER DEFAULT 0
);

CREATE INDEX idx_trending_searches_count ON trending_searches(search_count DESC);
CREATE INDEX idx_trending_searches_week ON trending_searches(week_count DESC);

-- 추천 레시피 기록 (추천 시스템 학습용)
CREATE TABLE recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50), -- 'ingredient_based', 'personalized', 'trending', 'meal_time'
  recommendation_score DECIMAL(5,4),
  was_clicked BOOLEAN DEFAULT FALSE,
  was_saved BOOLEAN DEFAULT FALSE,
  was_cooked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendation_history_user_id ON recommendation_history(user_id);
CREATE INDEX idx_recommendation_history_recipe_id ON recommendation_history(recipe_id);
CREATE INDEX idx_recommendation_history_type ON recommendation_history(recommendation_type);

-- ================================================
-- 8. NOTIFICATIONS
-- ================================================

-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 알림 내용
  notification_type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'meal_time', 'expiry' 등
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- 관련 엔티티
  related_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  related_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  related_comment_id UUID REFERENCES recipe_comments(id) ON DELETE CASCADE,
  
  -- 링크
  action_url TEXT,
  
  -- 상태
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- ================================================
-- 9. COOKING ACTIVITY
-- ================================================

-- 요리 완료 기록
CREATE TABLE cooking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- 세션 정보
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  total_time_minutes INTEGER,
  
  -- 평가
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
  would_cook_again BOOLEAN,
  
  -- 메모
  notes TEXT,
  photo_url TEXT,
  
  -- 수정사항
  modifications JSONB, -- 재료나 단계 수정 내용
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cooking_sessions_user_id ON cooking_sessions(user_id);
CREATE INDEX idx_cooking_sessions_recipe_id ON cooking_sessions(recipe_id);
CREATE INDEX idx_cooking_sessions_completed_at ON cooking_sessions(completed_at DESC);

-- ================================================
-- 10. SHOPPING LIST
-- ================================================

-- 장보기 리스트
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);

-- 장보기 리스트 아이템
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL, -- 어떤 레시피를 위한 재료인지
  
  ingredient_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  category VARCHAR(50),
  
  is_checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ,
  
  notes TEXT,
  estimated_price DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_recipe_id ON shopping_list_items(recipe_id);

-- ================================================
-- 11. MEAL PLANNING
-- ================================================

-- 식단 플랜
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_name VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_dates ON meal_plans(start_date, end_date);

-- 식단 플랜 상세
CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  
  planned_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
  servings INTEGER DEFAULT 1,
  
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_items_plan_id ON meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_date ON meal_plan_items(planned_date);
CREATE INDEX idx_meal_plan_items_recipe_id ON meal_plan_items(recipe_id);

-- ================================================
-- 13. ANALYTICS & METRICS
-- ================================================

-- 레시피 조회 이력 (상세 분석용)
CREATE TABLE recipe_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- 세션 정보
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- 리퍼러
  referrer TEXT,
  source VARCHAR(50), -- 'search', 'recommendation', 'profile', 'direct'
  
  -- 시간
  view_duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_views_recipe_id ON recipe_views(recipe_id);
CREATE INDEX idx_recipe_views_user_id ON recipe_views(user_id);
CREATE INDEX idx_recipe_views_created_at ON recipe_views(created_at DESC);

-- 일별 집계 (성능 최적화)
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,
  
  -- 전체 통계
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  
  total_recipes INTEGER DEFAULT 0,
  new_recipes INTEGER DEFAULT 0,
  
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(stat_date)
);

CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date DESC);

-- ================================================
-- 14. REPORTS & MODERATION
-- ================================================

-- 신고
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- 신고 대상
  reported_type VARCHAR(50) NOT NULL, -- 'recipe', 'comment', 'user'
  reported_id UUID NOT NULL,
  
  -- 신고 내용
  reason VARCHAR(50) NOT NULL, -- 'spam', 'inappropriate', 'copyright', 'other'
  description TEXT,
  
  -- 처리 상태
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_note TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(reported_type, reported_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ================================================
-- 15. SYSTEM & METADATA
-- ================================================

-- 시스템 설정
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 다국어 번역 (필요시)
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'recipe', 'ingredient', 'ui_text'
  entity_id UUID,
  language_code VARCHAR(10) NOT NULL, -- 'ko', 'en', 'ja' 등
  field_name VARCHAR(50) NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, language_code, field_name)
);

CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id, language_code);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 프로필: 모든 사람이 읽기 가능, 본인만 수정 가능
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 레시피: 공개된 레시피는 모두 읽기 가능, 작성자만 수정/삭제
CREATE POLICY "Published recipes are viewable by everyone"
  ON recipes FOR SELECT
  USING (is_published = true OR author_id = auth.uid());

CREATE POLICY "Users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = author_id);

-- 댓글: 모두 읽기 가능, 본인만 수정/삭제
CREATE POLICY "Comments are viewable by everyone"
  ON recipe_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON recipe_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON recipe_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON recipe_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 좋아요: 로그인한 사용자만 가능
CREATE POLICY "Authenticated users can like"
  ON recipe_likes FOR ALL
  USING (auth.uid() = user_id);

-- 저장: 본인 것만 관리
CREATE POLICY "Users can manage own saves"
  ON recipe_saves FOR ALL
  USING (auth.uid() = user_id);

-- 보유 재료: 본인 것만 관리
CREATE POLICY "Users can manage own ingredients"
  ON user_ingredients FOR ALL
  USING (auth.uid() = user_id);

-- 알림: 본인 것만 읽기/수정
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- 레시피 좋아요 카운트 업데이트
CREATE OR REPLACE FUNCTION update_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET likes_count = likes_count + 1 WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET likes_count = likes_count - 1 WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_likes
  AFTER INSERT OR DELETE ON recipe_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_likes_count();

-- 레시피 저장 카운트 업데이트
CREATE OR REPLACE FUNCTION update_recipe_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET saves_count = saves_count + 1 WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET saves_count = saves_count - 1 WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_saves
  AFTER INSERT OR DELETE ON recipe_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_saves_count();

-- 댓글 카운트 업데이트
CREATE OR REPLACE FUNCTION update_recipe_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET comments_count = comments_count + 1 WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET comments_count = comments_count - 1 WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_comments
  AFTER INSERT OR DELETE ON recipe_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_comments_count();

-- 팔로우 카운트 업데이트
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- 레시피 평균 평점 업데이트
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_rating
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_rating();

-- 레시피 작성 시 프로필 카운트 업데이트
CREATE OR REPLACE FUNCTION update_profile_recipes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET recipes_count = recipes_count + 1 WHERE id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET recipes_count = recipes_count - 1 WHERE id = OLD.author_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_recipes
  AFTER INSERT OR DELETE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_recipes_count();

-- ================================================
-- INITIAL DATA
-- ================================================

-- 시스템 설정 초기값
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', '점검 모드 활성화 여부'),
  ('signup_enabled', 'true', '회원가입 활성화 여부'),
  ('max_recipe_images', '10', '레시피 당 최대 이미지 수'),
  ('max_recipe_steps', '50', '레시피 당 최대 단계 수'),
  ('featured_recipes_count', '10', '메인 페이지 추천 레시피 수');

-- ================================================
-- USEFUL VIEWS
-- ================================================

-- 인기 레시피 뷰
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

-- 사용자 활동 요약 뷰
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

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- 복합 인덱스 (자주 함께 쿼리되는 컬럼들)
CREATE INDEX idx_recipes_published_cuisine ON recipes(is_published, cuisine_type) WHERE is_published = true;
CREATE INDEX idx_recipes_published_rating ON recipes(is_published, average_rating DESC) WHERE is_published = true;
CREATE INDEX idx_recipes_author_published ON recipes(author_id, is_published, created_at DESC);

-- 부분 인덱스 (조건부 쿼리 최적화)
CREATE INDEX idx_recipes_featured ON recipes(id) WHERE is_featured = true;
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- JSONB 인덱스
CREATE INDEX idx_ingredients_common_units ON ingredients_master USING GIN(common_units);
CREATE INDEX idx_ingredients_substitutes ON ingredients_master USING GIN(substitutes);

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE profiles IS '사용자 프로필 정보';
COMMENT ON TABLE recipes IS '레시피 메인 정보';
COMMENT ON TABLE recipe_ingredients IS '레시피별 재료 목록';
COMMENT ON TABLE recipe_steps IS '레시피 조리 단계';
COMMENT ON TABLE user_ingredients IS '사용자 보유 재료';
COMMENT ON TABLE cooking_sessions IS '요리 완료 기록';
COMMENT ON TABLE meal_plans IS '식단 계획';
COMMENT ON TABLE shopping_lists IS '장보기 리스트';

-- ================================================
-- COMPLETION
-- ================================================

-- Schema creation completed successfully!
-- Next steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Configure Storage buckets for images/videos
-- 3. Set up Authentication providers (Google OAuth)
-- 4. Create API routes in Next.js
-- 5. Implement real-time subscriptions for notifications
