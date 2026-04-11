-- 학습 데이터 수집을 위한 피드백 테이블 단순화 및 개선

-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS ingredient_recognition_feedback CASCADE;

-- 새로운 학습 데이터 테이블 생성
CREATE TABLE ingredient_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 이미지 정보
  image_url TEXT NOT NULL,  -- Supabase Storage URL
  image_hash TEXT NOT NULL,  -- 중복 방지용 해시
  image_width INTEGER,       -- 이미지 크기 (학습 시 유용)
  image_height INTEGER,

  -- 사용자가 라벨링한 재료 (학습의 Ground Truth)
  user_labels JSONB NOT NULL,
  -- 예: [
  --   {"name": "양파", "ingredient_id": "uuid", "category": "veggie"},
  --   {"name": "토마토", "ingredient_id": "uuid", "category": "veggie"}
  -- ]

  -- 학습 데이터 품질 관리
  training_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending: 검토 대기
  -- approved: 학습 데이터로 승인됨
  -- rejected: 품질 문제로 거부됨
  -- used: 이미 학습에 사용됨

  quality_score INTEGER,  -- 관리자가 매긴 품질 점수 (1-5)
  admin_notes TEXT,       -- 관리자 메모

  -- 데이터 사용 동의
  consent_given BOOLEAN NOT NULL DEFAULT true,

  -- 메타데이터 (학습 시 참고)
  photo_context VARCHAR(50),  -- 'raw', 'cooked', 'packaged', 'multiple' 등
  lighting_condition VARCHAR(20),  -- 'natural', 'artificial', 'mixed'

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_training_data_user_id ON ingredient_training_data(user_id);
CREATE INDEX idx_training_data_status ON ingredient_training_data(training_status);
CREATE INDEX idx_training_data_created_at ON ingredient_training_data(created_at);
CREATE INDEX idx_training_data_consent ON ingredient_training_data(consent_given) WHERE consent_given = true;
CREATE INDEX idx_training_data_approved ON ingredient_training_data(training_status) WHERE training_status = 'approved';

-- RLS 정책
ALTER TABLE ingredient_training_data ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/생성
CREATE POLICY "Users can view own training data"
  ON ingredient_training_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training data"
  ON ingredient_training_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 데이터 조회 및 수정 가능
CREATE POLICY "Admins can view all training data"
  ON ingredient_training_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update training data"
  ON ingredient_training_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_training_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_data_updated_at
  BEFORE UPDATE ON ingredient_training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_training_data_updated_at();

-- Supabase Storage 버킷 생성 (이미지 저장용)
-- 주의: Storage 버킷은 Supabase 대시보드에서 수동으로 생성해야 할 수 있습니다.
-- 버킷 이름: 'ingredient-photos'
-- Public 설정: false (인증된 사용자만 업로드)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png

COMMENT ON TABLE ingredient_training_data IS '커스텀 AI 모델 학습을 위한 사용자 라벨링 데이터';
COMMENT ON COLUMN ingredient_training_data.user_labels IS '사용자가 직접 라벨링한 재료 목록 (Ground Truth)';
COMMENT ON COLUMN ingredient_training_data.training_status IS 'pending/approved/rejected/used - 학습 데이터 품질 관리';
COMMENT ON COLUMN ingredient_training_data.consent_given IS '학습 데이터 사용 동의 여부';
