-- =====================================================================
-- 배달(delivery) 프로덕션 스키마 — 향후 적용 예정. 절대 자동 apply 금지.
-- =====================================================================
-- 이 파일은 *문서* 목적. dev/prod 어디에도 적용하지 않음.
-- 출시 시점에 검토 후 정규 마이그레이션(supabase/migrations/)으로 옮길 것.
--
-- 현재 적용된 미니멀 스키마: supabase/migrations/20260516_delivery_schema.sql
--                          + 20260517_delivery_orders.sql
--
-- 적용 시점 trigger:
--   1. 결제 PG 통합 → delivery_payment_records
--   2. 라이더 운영 시작 → delivery_rider_locations, delivery_dispatch_log, delivery_settlements
--   3. 첫 사용자 100명+ → delivery_reviews
--   4. 푸시 알림 → delivery_notifications
--   5. 쿠폰·프로모션 마케팅 → delivery_promotions, delivery_coupons
--   6. 운영 자동화 → delivery_business_hours_overrides, delivery_order_status_history
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 라이더 위치 시계열 — 실시간 추적
-- ---------------------------------------------------------------------
-- 라이더 앱이 30초~1분 간격으로 현 좌표 POST. 시계열이라 양 많음.
-- 90일 보존 후 cron으로 삭제. 또는 hot/cold 분리 (Postgres → S3).
-- PostGIS 활성화 필요: CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE delivery_rider_locations (
  id           bigserial PRIMARY KEY,
  rider_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location     geography(POINT, 4326) NOT NULL,
  accuracy_m   numeric(8,2),                 -- GPS 정확도 (미터)
  heading_deg  numeric(5,2),                 -- 진행 방향
  speed_kmh    numeric(6,2),                 -- 속도
  battery_pct  smallint,                     -- 배터리 잔량 (저전력 알림용)
  order_id     uuid REFERENCES delivery_orders(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX delivery_rider_locations_rider_time_idx
  ON delivery_rider_locations (rider_id, created_at DESC);
CREATE INDEX delivery_rider_locations_geo_idx
  ON delivery_rider_locations USING GIST (location);
CREATE INDEX delivery_rider_locations_order_idx
  ON delivery_rider_locations (order_id, created_at) WHERE order_id IS NOT NULL;

-- RLS: 라이더 본인 + 식당 owner(배차 중) + 사용자(주문 추적) + admin
-- 정책 작성은 적용 시점에 결정 (개인정보 노출 범위 검토 필요).

-- ---------------------------------------------------------------------
-- 2) 주문 상태 변경 audit log
-- ---------------------------------------------------------------------
-- 누가·언제·왜 상태를 바꿨는지 추적. CS 분쟁 해결, 부정 탐지.

CREATE TABLE delivery_order_status_history (
  id            bigserial PRIMARY KEY,
  order_id      uuid NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  from_status   delivery_order_status,
  to_status     delivery_order_status NOT NULL,
  actor_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- 누가 변경
  actor_role    text,                                              -- 'user' | 'merchant' | 'rider' | 'admin' | 'system'
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX delivery_order_status_history_order_idx
  ON delivery_order_status_history (order_id, created_at);

-- 트리거로 자동 기록 — delivery_orders.status 변경 시 row insert.

-- ---------------------------------------------------------------------
-- 3) 결제 기록 (PG 통합 후 필수)
-- ---------------------------------------------------------------------
-- 결제 1건당 1 row. 부분 환불·재청구 시 multiple rows.
-- 토스페이먼츠·아임포트·카카오페이·네이버페이 PG 거래 ID 모두 보존.

CREATE TABLE delivery_payment_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES delivery_orders(id) ON DELETE RESTRICT,
  payment_type    text NOT NULL,                  -- 'charge' | 'refund' | 'partial_refund'
  pg_provider     text NOT NULL,                  -- 'toss' | 'iamport' | 'kakao_pay' | 'mock'
  pg_transaction_id text NOT NULL,                -- PG가 발급한 거래번호
  amount          int NOT NULL,                   -- 음수 = 환불
  status          text NOT NULL,                  -- 'pending' | 'success' | 'failed' | 'cancelled'
  card_last4      text,
  raw_response    jsonb,                          -- PG 원본 응답 보존
  failure_reason  text,
  processed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX delivery_payment_records_order_idx
  ON delivery_payment_records (order_id, created_at);
CREATE UNIQUE INDEX delivery_payment_records_pg_tx_idx
  ON delivery_payment_records (pg_provider, pg_transaction_id);

-- ---------------------------------------------------------------------
-- 4) 쿠폰·프로모션
-- ---------------------------------------------------------------------

CREATE TABLE delivery_promotions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text UNIQUE,                      -- "WELCOME5000" 같은 쿠폰 코드. NULL이면 자동 적용
  name          text NOT NULL,
  description   text,
  discount_type text NOT NULL,                    -- 'amount' | 'percent' | 'free_delivery'
  discount_value int NOT NULL,
  min_order     int NOT NULL DEFAULT 0,
  max_discount  int,                              -- percent 타입의 상한
  target_restaurant_id uuid REFERENCES delivery_restaurants(id),
  starts_at     timestamptz,
  ends_at       timestamptz,
  usage_limit   int,                              -- 전체 사용 횟수 제한
  per_user_limit int DEFAULT 1,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_promotion_redemptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  uuid NOT NULL REFERENCES delivery_promotions(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id      uuid NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  discount_applied int NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX delivery_promotion_redemptions_user_idx
  ON delivery_promotion_redemptions (user_id, promotion_id);

-- ---------------------------------------------------------------------
-- 5) 리뷰 (식당·라이더 각각)
-- ---------------------------------------------------------------------

CREATE TABLE delivery_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL UNIQUE REFERENCES delivery_orders(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id   uuid NOT NULL REFERENCES delivery_restaurants(id) ON DELETE CASCADE,
  rider_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  food_rating     smallint CHECK (food_rating BETWEEN 1 AND 5),
  delivery_rating smallint CHECK (delivery_rating BETWEEN 1 AND 5),
  comment         text,
  images          text[],
  is_hidden       boolean NOT NULL DEFAULT false,  -- 부적절 리뷰 admin 숨김
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX delivery_reviews_restaurant_idx
  ON delivery_reviews (restaurant_id, created_at DESC) WHERE is_hidden = false;
CREATE INDEX delivery_reviews_rider_idx
  ON delivery_reviews (rider_id, created_at DESC) WHERE rider_id IS NOT NULL;

-- delivery_restaurants.rating / .rating_count 트리거로 갱신.
-- delivery_rider_profiles.rating 도 마찬가지.

-- ---------------------------------------------------------------------
-- 6) 알림 (outbox 패턴 — FCM·푸시 전송 큐)
-- ---------------------------------------------------------------------

CREATE TABLE delivery_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          text NOT NULL,                    -- 'order_accepted' | 'order_ready' | 'order_picked_up' | ...
  payload       jsonb NOT NULL,                   -- { order_id, restaurant_name, ... }
  channel       text NOT NULL,                    -- 'push' | 'email' | 'sms' | 'in_app'
  status        text NOT NULL DEFAULT 'pending',  -- 'pending' | 'sent' | 'failed'
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  failure_reason text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX delivery_notifications_pending_idx
  ON delivery_notifications (status, scheduled_at) WHERE status = 'pending';
CREATE INDEX delivery_notifications_user_idx
  ON delivery_notifications (user_id, created_at DESC);

-- worker가 status='pending'인 row를 polling. FCM 토큰은 profiles 또는 별도 device_tokens 테이블.

-- ---------------------------------------------------------------------
-- 7) 배차 시도 이력
-- ---------------------------------------------------------------------
-- 한 주문에 라이더가 배차 거절·시간초과해서 재배차되는 경우 추적.

CREATE TABLE delivery_dispatch_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  rider_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dispatched_at   timestamptz NOT NULL DEFAULT now(),
  response        text,                           -- 'accepted' | 'declined' | 'timeout'
  responded_at    timestamptz,
  decline_reason  text
);

CREATE INDEX delivery_dispatch_log_order_idx
  ON delivery_dispatch_log (order_id, dispatched_at);
CREATE INDEX delivery_dispatch_log_rider_idx
  ON delivery_dispatch_log (rider_id, dispatched_at DESC);

-- ---------------------------------------------------------------------
-- 8) 라이더 정산
-- ---------------------------------------------------------------------
-- 주간/일간 정산. 배달 수수료 합산 + 인센티브 + 페널티.

CREATE TABLE delivery_settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  total_deliveries int NOT NULL DEFAULT 0,
  base_earnings   int NOT NULL DEFAULT 0,        -- 건당 기본 수수료 합산
  incentive       int NOT NULL DEFAULT 0,        -- 피크타임·우천 인센티브
  penalty         int NOT NULL DEFAULT 0,        -- 취소·노쇼 페널티
  net_payout      int NOT NULL DEFAULT 0,        -- 실 지급액
  status          text NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  paid_at         timestamptz,
  bank_account    text,                          -- 송금 계좌 (암호화 권장)
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX delivery_settlements_rider_period_idx
  ON delivery_settlements (rider_id, period_start, period_end);

-- ---------------------------------------------------------------------
-- 9) 식당 특별 휴무일·임시 영업시간
-- ---------------------------------------------------------------------

CREATE TABLE delivery_business_hours_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES delivery_restaurants(id) ON DELETE CASCADE,
  date            date NOT NULL,                  -- 특정 날짜
  is_closed       boolean NOT NULL DEFAULT false, -- 휴무일
  open_time       time,                           -- 임시 영업시간
  close_time      time,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX delivery_business_hours_overrides_idx
  ON delivery_business_hours_overrides (restaurant_id, date);

-- ---------------------------------------------------------------------
-- 10) device tokens (푸시 알림 발송)
-- ---------------------------------------------------------------------

CREATE TABLE delivery_device_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token         text NOT NULL,                    -- FCM 토큰
  platform      text NOT NULL,                    -- 'ios' | 'android' | 'web'
  app_role      text NOT NULL,                    -- 'consumer' | 'merchant' | 'rider'
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX delivery_device_tokens_token_idx ON delivery_device_tokens (token);
CREATE INDEX delivery_device_tokens_user_idx ON delivery_device_tokens (user_id, app_role);

-- =====================================================================
-- 끝.
-- 적용 순서 권장: payments → reviews → notifications/dispatch_log → settlements
--             → rider_locations (PostGIS 설치 필요) → business_hours_overrides
-- 각 적용 시 RLS 정책 별도 설계 필요.
-- =====================================================================
