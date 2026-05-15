-- 재료 가격 정보 Phase 1 — 사용자 영수증 기반 크라우드소싱 가격
-- CLAUDE.md "재료 가격 정보 로드맵" 스키마. KAMIS 공식 시세는 별도(Phase 1 후속).
-- stores는 Kakao 장소 API 캐시용 — 지금은 store_id NULL 허용 (지도 기능 Phase 3).

CREATE TABLE IF NOT EXISTS stores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,            -- "이마트 강남점"
  brand           VARCHAR(50),                      -- "이마트"
  store_type      VARCHAR(30),                      -- 대형마트|편의점|전통시장|온라인
  address         TEXT,
  lat             DECIMAL(10, 7),
  lng             DECIMAL(10, 7),
  kakao_place_id  VARCHAR(50) UNIQUE,               -- 중복 방지
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_price_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   UUID REFERENCES ingredients_master(id) ON DELETE CASCADE,
  store_id        UUID REFERENCES stores(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  price           INTEGER NOT NULL,                 -- 구매 가격 (원)
  quantity        DECIMAL,
  unit            VARCHAR(20),
  price_per_unit  DECIMAL,                          -- 100g/100ml/개당 정규화 (비교 핵심)
  purchase_date   DATE,
  source          VARCHAR(20) NOT NULL DEFAULT 'receipt',  -- receipt | manual
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT price_positive CHECK (price > 0)
);

CREATE INDEX IF NOT EXISTS idx_price_reports_ingredient
  ON ingredient_price_reports(ingredient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_reports_user
  ON ingredient_price_reports(user_id);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_price_reports ENABLE ROW LEVEL SECURITY;

-- stores: 모두 읽기 (장소 정보는 공용 캐시), 쓰기는 인증 사용자
DROP POLICY IF EXISTS "stores_read_all" ON stores;
CREATE POLICY "stores_read_all" ON stores
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "stores_insert_auth" ON stores;
CREATE POLICY "stores_insert_auth" ON stores
  FOR INSERT TO authenticated WITH CHECK (true);

-- price_reports: 집계용이라 읽기는 모두 허용 (개인 식별 정보 없음 — user_id는 SET NULL).
-- 본인 리포트만 작성/수정/삭제.
DROP POLICY IF EXISTS "price_reports_read_all" ON ingredient_price_reports;
CREATE POLICY "price_reports_read_all" ON ingredient_price_reports
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "price_reports_own_write" ON ingredient_price_reports;
CREATE POLICY "price_reports_own_write" ON ingredient_price_reports
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "price_reports_own_modify" ON ingredient_price_reports;
CREATE POLICY "price_reports_own_modify" ON ingredient_price_reports
  FOR DELETE TO authenticated USING (user_id = auth.uid());
