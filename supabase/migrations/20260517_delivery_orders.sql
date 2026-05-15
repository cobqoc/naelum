-- 배달 주문·라이더 — 미니멀 (dev/test 작동에 필요한 만큼만).
--
-- 이 파일에 포함된 것 (dev에 적용):
--   - delivery_addresses (사용자 배달 주소록)
--   - delivery_order_status enum + delivery_orders + delivery_order_items
--   - delivery_rider_profiles (라이더 prototype용 미니멀 — online/offline)
--   - delivery_orders.rider_id (라이더 배차 추적)
--   - 상태 전환 검증 트리거 + RLS
--
-- 프로덕션 출시 시 추가 필요한 것 — docs/db/delivery-production-schema.sql 참고:
--   - delivery_rider_locations (위치 시계열, PostGIS)
--   - delivery_order_status_history (audit log)
--   - delivery_payment_records (결제·환불 이력)
--   - delivery_promotions/coupons (쿠폰)
--   - delivery_reviews
--   - delivery_notifications (FCM outbox)
--   - delivery_dispatch_log
--   - delivery_settlements (라이더 정산)
--   - delivery_business_hours_overrides
--
-- 의존성: delivery_restaurants (20260516_delivery_schema.sql)

-- 1) 사용자 배달 주소
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label           text,                  -- "집", "회사" 등
  recipient_name  text,
  recipient_phone text,
  zipcode         text,
  road_address    text,                  -- 도로명 주소
  detail          text,                  -- 상세 주소 (호수 등)
  lat             numeric(10,7),
  lng             numeric(10,7),
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_addresses_user_idx
  ON delivery_addresses (user_id, is_default DESC);

-- 2) 주문 상태 enum
DO $$ BEGIN
  CREATE TYPE delivery_order_status AS ENUM (
    'pending',     -- 결제 대기
    'paid',        -- 결제 완료
    'accepted',    -- 식당 접수
    'preparing',   -- 조리 중
    'ready',       -- 픽업 대기
    'picked_up',   -- 라이더 픽업
    'delivered',   -- 배달 완료
    'cancelled',   -- 취소
    'refunded'     -- 환불
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3) 라이더 프로필 (미니멀 — online/offline + 차량 정보)
CREATE TABLE IF NOT EXISTS delivery_rider_profiles (
  user_id          uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'offline', -- offline | online | busy
  vehicle_type     text,                            -- motorcycle | bicycle | car | walk
  current_lat      numeric(10,7),
  current_lng      numeric(10,7),
  last_seen_at     timestamptz,
  total_deliveries int NOT NULL DEFAULT 0,
  rating           numeric(3,2) NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_rider_profiles_status_idx
  ON delivery_rider_profiles (status) WHERE status != 'offline';

-- 4) 주문
CREATE TABLE IF NOT EXISTS delivery_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    text UNIQUE NOT NULL,               -- "YYYYMMDD-XXXX"
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  restaurant_id   uuid NOT NULL REFERENCES delivery_restaurants(id),
  rider_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  address_id      uuid REFERENCES delivery_addresses(id) ON DELETE SET NULL,

  -- 주소 스냅샷 (주소 삭제돼도 주문 보존)
  address_snapshot jsonb NOT NULL,

  status          delivery_order_status NOT NULL DEFAULT 'pending',
  subtotal        int  NOT NULL,
  delivery_fee    int  NOT NULL,
  discount        int  NOT NULL DEFAULT 0,
  total           int  NOT NULL,
  payment_method  text,                                -- 'card' | 'kakao_pay' | 'toss' | 'mock'
  payment_id      text,                                -- PG 거래 ID
  request_note    text,                                -- "벨 누르지 마세요" 등
  estimated_delivery_at timestamptz,
  placed_at       timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  ready_at        timestamptz,
  picked_up_at    timestamptz,
  delivered_at    timestamptz,
  cancelled_at    timestamptz,
  cancel_reason   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_orders_user_idx
  ON delivery_orders (user_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS delivery_orders_restaurant_idx
  ON delivery_orders (restaurant_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS delivery_orders_rider_idx
  ON delivery_orders (rider_id, placed_at DESC) WHERE rider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS delivery_orders_status_idx
  ON delivery_orders (status) WHERE status NOT IN ('delivered','cancelled','refunded');

-- 5) 주문 항목
CREATE TABLE IF NOT EXISTS delivery_order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  menu_item_id    uuid REFERENCES delivery_menu_items(id) ON DELETE SET NULL,

  -- snapshot (메뉴 변경·삭제돼도 주문 내역 보존)
  name_snapshot   text NOT NULL,
  price_snapshot  int  NOT NULL,
  quantity        int  NOT NULL CHECK (quantity > 0),
  selected_options jsonb,                              -- [{"group":"사이즈","option":"곱빼기","price":2000}]
  subtotal        int  NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_order_items_order_idx
  ON delivery_order_items (order_id);

-- 6) updated_at 자동 갱신 — delivery_touch_updated_at()은 20260516_delivery_schema.sql에 정의됨
CREATE TRIGGER delivery_addresses_updated_at
  BEFORE UPDATE ON delivery_addresses
  FOR EACH ROW EXECUTE FUNCTION delivery_touch_updated_at();

CREATE TRIGGER delivery_orders_updated_at
  BEFORE UPDATE ON delivery_orders
  FOR EACH ROW EXECUTE FUNCTION delivery_touch_updated_at();

CREATE TRIGGER delivery_rider_profiles_updated_at
  BEFORE UPDATE ON delivery_rider_profiles
  FOR EACH ROW EXECUTE FUNCTION delivery_touch_updated_at();

-- 7) 주문 상태 전환 검증 — 잘못된 전이 차단
CREATE OR REPLACE FUNCTION delivery_validate_status_transition()
RETURNS trigger AS $$
DECLARE
  ok boolean := false;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  ok := (OLD.status, NEW.status) IN (
    ('pending', 'paid'),
    ('pending', 'cancelled'),
    ('paid', 'accepted'),
    ('paid', 'cancelled'),
    ('paid', 'refunded'),
    ('accepted', 'preparing'),
    ('accepted', 'cancelled'),
    ('preparing', 'ready'),
    ('preparing', 'cancelled'),
    ('ready', 'picked_up'),
    ('picked_up', 'delivered'),
    ('delivered', 'refunded')
  );
  IF NOT ok THEN
    RAISE EXCEPTION 'Invalid order status transition: % -> %', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_orders_status_transition
  BEFORE UPDATE OF status ON delivery_orders
  FOR EACH ROW EXECUTE FUNCTION delivery_validate_status_transition();

-- 8) RLS
ALTER TABLE delivery_addresses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_rider_profiles  ENABLE ROW LEVEL SECURITY;

-- 주소: 본인 + admin
CREATE POLICY "user can manage own addresses"
  ON delivery_addresses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin can manage all addresses"
  ON delivery_addresses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 라이더 프로필: 본인 관리, 식당 owner와 admin은 조회 가능 (배차 위해)
CREATE POLICY "rider can manage own profile"
  ON delivery_rider_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "anyone authenticated can read rider profiles"
  ON delivery_rider_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin can manage all rider profiles"
  ON delivery_rider_profiles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 주문: 사용자 본인 + 식당 owner + 배차받은 라이더 + admin
CREATE POLICY "user can read own orders"
  ON delivery_orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user can create own orders"
  ON delivery_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user can cancel own orders"
  ON delivery_orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "restaurant owner can manage own orders"
  ON delivery_orders FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM delivery_restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "rider can read and update assigned orders"
  ON delivery_orders FOR SELECT
  TO authenticated
  USING (rider_id = auth.uid());

CREATE POLICY "rider can update assigned orders"
  ON delivery_orders FOR UPDATE
  TO authenticated
  USING (rider_id = auth.uid())
  WITH CHECK (rider_id = auth.uid());

CREATE POLICY "admin can manage all orders"
  ON delivery_orders FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 주문 항목: 주문 접근 가능자만
CREATE POLICY "user can read own order items"
  ON delivery_order_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM delivery_orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE POLICY "user can create own order items"
  ON delivery_order_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM delivery_orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE POLICY "restaurant owner can read order items"
  ON delivery_order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_orders o
    JOIN delivery_restaurants r ON r.id = o.restaurant_id
    WHERE o.id = order_id AND r.owner_id = auth.uid()
  ));

CREATE POLICY "rider can read assigned order items"
  ON delivery_order_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM delivery_orders o WHERE o.id = order_id AND o.rider_id = auth.uid()));

CREATE POLICY "admin can manage all order items"
  ON delivery_order_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
