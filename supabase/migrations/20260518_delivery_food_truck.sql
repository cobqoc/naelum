-- 배달/지도 — 푸드트럭 도메인 (Phase 1).
--
-- 설계 메모:
-- - 푸드트럭 = "위치가 시간에 따라 바뀌는 delivery_restaurant".
--   별도 테이블 신설 대신 delivery_restaurants 재사용 + place_type 으로 구분.
--   메뉴·주문·사장님 어드민·RLS·라이더 인프라를 그대로 공유.
-- - delivery_restaurants.lat/lng 는 트럭의 "기본 거점"으로 유지.
--   실제 지도에 찍히는 핀은 delivery_truck_locations 의 status='live' 행.
-- - 좌표 검색: 20260516_delivery_schema.sql 의 결정 계승 — PostGIS 미사용,
--   lat/lng btree 인덱스로 bbox 조회. 스케일 필요 시 PostGIS/GIST 전환.
-- - 멱등(idempotent): 재적용·dev→prod 순차 적용 안전.
--
-- 의존성: public.delivery_restaurants, public.profiles, delivery_touch_updated_at()
-- 적용: naelum-dev(jmyrdoguxlizvajfcwep) 먼저 검증 → 이후 prod(rgnlgpfazxgwsnkgrhzs) 사용자가 PR 머지 시점에

-- 1) 식당 vs 푸드트럭 구분 컬럼
ALTER TABLE delivery_restaurants
  ADD COLUMN IF NOT EXISTS place_type text NOT NULL DEFAULT 'restaurant';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'delivery_restaurants_place_type_chk'
  ) THEN
    ALTER TABLE delivery_restaurants
      ADD CONSTRAINT delivery_restaurants_place_type_chk
      CHECK (place_type IN ('restaurant', 'food_truck'));
  END IF;
END $$;

-- 푸드트럭만 빠르게 거르기 위한 부분 인덱스 (활성 식당 기준)
CREATE INDEX IF NOT EXISTS delivery_restaurants_place_type_idx
  ON delivery_restaurants (place_type) WHERE is_active = true;

-- 2) 푸드트럭 위치 시계열 — "오늘은 강남역, 내일은 여의도"
CREATE TABLE IF NOT EXISTS delivery_truck_locations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES delivery_restaurants(id) ON DELETE CASCADE,
  lat           numeric(10,7) NOT NULL,
  lng           numeric(10,7) NOT NULL,
  label         text,                                  -- "강남역 11번 출구"
  status        text NOT NULL DEFAULT 'scheduled',     -- scheduled | live | ended
  starts_at     timestamptz,
  ends_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delivery_truck_locations_status_chk
    CHECK (status IN ('scheduled', 'live', 'ended'))
);

-- 식당별 스케줄 조회
CREATE INDEX IF NOT EXISTS delivery_truck_loc_restaurant_idx
  ON delivery_truck_locations (restaurant_id, status);

-- 핫패스: 지도에 찍을 현재 영업 중(live) 트럭만 bbox 조회
CREATE INDEX IF NOT EXISTS delivery_truck_loc_live_idx
  ON delivery_truck_locations (status, lat, lng) WHERE status = 'live';

-- 3) updated_at 자동 갱신 — 기존 함수 재사용 (20260516_delivery_schema.sql)
DROP TRIGGER IF EXISTS delivery_truck_locations_updated_at ON delivery_truck_locations;
CREATE TRIGGER delivery_truck_locations_updated_at
  BEFORE UPDATE ON delivery_truck_locations
  FOR EACH ROW EXECUTE FUNCTION delivery_touch_updated_at();

-- 4) RLS — delivery_menu_items 정책 패턴 미러
--    활성 식당의 위치는 누구나 조회 / 수정은 owner 또는 admin
ALTER TABLE delivery_truck_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read truck locations of active restaurants"
  ON delivery_truck_locations;
CREATE POLICY "anyone can read truck locations of active restaurants"
  ON delivery_truck_locations FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_restaurants r
    WHERE r.id = restaurant_id AND r.is_active = true
  ));

DROP POLICY IF EXISTS "owner can manage own restaurant truck locations"
  ON delivery_truck_locations;
CREATE POLICY "owner can manage own restaurant truck locations"
  ON delivery_truck_locations FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_restaurants r
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM delivery_restaurants r
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "admin can manage all truck locations"
  ON delivery_truck_locations;
CREATE POLICY "admin can manage all truck locations"
  ON delivery_truck_locations FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
