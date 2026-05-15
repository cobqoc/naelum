-- 배달 기능 — 식당·메뉴·주문 도메인.
--
-- 설계 메모:
-- - public schema에 delivery_ prefix로 통일 (Supabase PostgREST 기본 노출 schema 활용)
-- - 추후 schema 분리 검토: 사용자 1만+ 시점에 별도 schema or instance로 격리
-- - 노출 제어: 라우트 자체는 /[lang]/delivery 로 두되, 진입은 admin 페이지에서만 허용
-- - 좌표 검색: PostGIS 활성화 후 GIST 인덱스 사용. 현 단계는 lat/lng 컬럼으로만 시작
-- - 운영시간: business_hours jsonb { "mon": {"open":"09:00","close":"22:00","is_open":true}, ... }
--
-- 의존성: public.profiles (owner_id FK)
-- 호환: 기존 낼름 스키마와 충돌 없음 (모든 신규 테이블 prefix)

-- 1) 식당
CREATE TABLE IF NOT EXISTS delivery_restaurants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name            text NOT NULL,
  description     text,
  cuisine_types   text[] NOT NULL DEFAULT '{}',          -- ['한식','분식']
  phone           text,
  address         text,
  lat             numeric(10,7),
  lng             numeric(10,7),
  delivery_radius_m  int  NOT NULL DEFAULT 3000,
  min_order_price    int  NOT NULL DEFAULT 0,
  delivery_fee       int  NOT NULL DEFAULT 0,
  avg_cook_time_min  int  NOT NULL DEFAULT 20,
  rating          numeric(3,2) NOT NULL DEFAULT 0,
  rating_count    int          NOT NULL DEFAULT 0,
  is_open         boolean      NOT NULL DEFAULT false,
  is_active       boolean      NOT NULL DEFAULT true,
  business_hours  jsonb,
  thumbnail_url   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_restaurants_active_idx
  ON delivery_restaurants (is_active, is_open) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS delivery_restaurants_cuisine_idx
  ON delivery_restaurants USING GIN (cuisine_types);
CREATE INDEX IF NOT EXISTS delivery_restaurants_geo_idx
  ON delivery_restaurants (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 2) 메뉴 카테고리 (식당별)
CREATE TABLE IF NOT EXISTS delivery_menu_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES delivery_restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  sort_order    int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_menu_categories_restaurant_idx
  ON delivery_menu_categories (restaurant_id, sort_order);

-- 3) 메뉴 항목
CREATE TABLE IF NOT EXISTS delivery_menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES delivery_restaurants(id) ON DELETE CASCADE,
  category_id   uuid REFERENCES delivery_menu_categories(id) ON DELETE SET NULL,
  name          text NOT NULL,
  description   text,
  price         int  NOT NULL,
  image_url     text,
  is_available  boolean NOT NULL DEFAULT true,
  is_popular    boolean NOT NULL DEFAULT false,
  sort_order    int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_menu_items_restaurant_idx
  ON delivery_menu_items (restaurant_id, is_available, sort_order);

-- 4) updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION delivery_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_restaurants_updated_at
  BEFORE UPDATE ON delivery_restaurants
  FOR EACH ROW EXECUTE FUNCTION delivery_touch_updated_at();

CREATE TRIGGER delivery_menu_items_updated_at
  BEFORE UPDATE ON delivery_menu_items
  FOR EACH ROW EXECUTE FUNCTION delivery_touch_updated_at();

-- 5) RLS — 누구나 조회 가능, 수정은 owner 또는 admin
ALTER TABLE delivery_restaurants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_menu_items      ENABLE ROW LEVEL SECURITY;

-- 식당: 활성 식당은 누구나 조회 가능
CREATE POLICY "anyone can read active restaurants"
  ON delivery_restaurants FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 식당: owner는 본인 식당 모든 접근
CREATE POLICY "owner can manage own restaurant"
  ON delivery_restaurants FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 식당: admin은 모두 접근
CREATE POLICY "admin can manage all restaurants"
  ON delivery_restaurants FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 메뉴 카테고리·항목: 활성 식당 거는 누구나 조회
CREATE POLICY "anyone can read menu categories of active restaurants"
  ON delivery_menu_categories FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.is_active = true));

CREATE POLICY "owner can manage own restaurant menu categories"
  ON delivery_menu_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "admin can manage all menu categories"
  ON delivery_menu_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "anyone can read menu items of active restaurants"
  ON delivery_menu_items FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.is_active = true));

CREATE POLICY "owner can manage own restaurant menu items"
  ON delivery_menu_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "admin can manage all menu items"
  ON delivery_menu_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 6) 샘플 데이터 (dev 환경 — 페이지 검증용)
INSERT INTO delivery_restaurants (id, name, description, cuisine_types, address, delivery_fee, min_order_price, avg_cook_time_min, rating, rating_count, is_open, thumbnail_url)
VALUES
  ('11111111-1111-1111-1111-111111111101', '엄마손 김치찌개', '얼큰한 김치찌개 전문점. 24시간 운영.', ARRAY['한식','찌개'], '서울 강남구', 3000, 12000, 25, 4.6, 1240, true, NULL),
  ('11111111-1111-1111-1111-111111111102', '도쿄 라멘하우스', '정통 일본식 돈코츠 라멘.', ARRAY['일식','라멘'], '서울 마포구', 2500, 15000, 20, 4.8, 890, true, NULL),
  ('11111111-1111-1111-1111-111111111103', '북경반점', '중화요리 전문. 짜장면·짬뽕.', ARRAY['중식'], '서울 서초구', 2000, 10000, 30, 4.3, 560, true, NULL),
  ('11111111-1111-1111-1111-111111111104', '피자레스토', '뉴욕 스타일 피자.', ARRAY['양식','피자'], '서울 송파구', 4000, 20000, 35, 4.5, 2100, false, NULL),
  ('11111111-1111-1111-1111-111111111105', '청춘분식', '떡볶이·순대·튀김.', ARRAY['분식'], '서울 강서구', 1500, 8000, 15, 4.4, 980, true, NULL),
  ('11111111-1111-1111-1111-111111111106', '비건테이블', '식물성 한식 비건 메뉴.', ARRAY['한식','비건'], '서울 종로구', 3500, 18000, 25, 4.7, 320, true, NULL)
ON CONFLICT (id) DO NOTHING;

-- 카테고리·메뉴 샘플 (엄마손 김치찌개)
INSERT INTO delivery_menu_categories (id, restaurant_id, name, sort_order) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', '대표 메뉴', 0),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', '사이드', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_menu_items (restaurant_id, category_id, name, description, price, is_popular, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', '김치찌개', '돼지고기 듬뿍, 묵은지 사용', 12000, true, 0),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', '된장찌개', '집된장으로 끓인 진한 된장찌개', 11000, false, 1),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', '계란말이', '두툼한 계란말이', 6000, false, 0)
ON CONFLICT DO NOTHING;
