-- 영수증 스캔 데이터 저장 테이블
-- 파서 개선 및 매핑 테이블 업데이트에 활용

CREATE TABLE IF NOT EXISTS receipt_scan_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ocr_provider VARCHAR(50) NOT NULL,
  raw_ocr_text TEXT,
  parsed_items JSONB,
  user_confirmed_items JSONB,
  detected_store VARCHAR(100),
  receipt_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_receipt_scan_data_user_id ON receipt_scan_data(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_scan_data_created_at ON receipt_scan_data(created_at);

-- RLS 활성화
ALTER TABLE receipt_scan_data ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 삽입
CREATE POLICY "Users can insert own receipt data"
  ON receipt_scan_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 데이터만 조회
CREATE POLICY "Users can view own receipt data"
  ON receipt_scan_data
  FOR SELECT
  USING (auth.uid() = user_id);
