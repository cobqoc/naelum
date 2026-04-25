-- 이미지 인식 피드백 테이블 (커스텀 모델 학습용 데이터)
CREATE TABLE IF NOT EXISTS ingredient_recognition_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 이미지 정보
  image_url TEXT,  -- Supabase Storage URL (옵션)
  image_hash TEXT NOT NULL,  -- 이미지 고유 식별자 (중복 방지)

  -- AI 감지 결과
  detected_labels JSONB NOT NULL,  -- MobileNet 원본 결과
  -- 예: [{"className": "bell pepper", "probability": 0.95, "koreanName": "파프리카"}]

  -- 사용자 확정 결과
  user_confirmed_labels JSONB NOT NULL,  -- 사용자가 실제 선택/수정한 재료
  -- 예: [{"detectedLabel": "bell pepper", "selectedName": "파프리카", "ingredientId": "uuid"}]

  -- 피드백 타입
  feedback_type VARCHAR(20) NOT NULL,  -- 'correct' | 'partial' | 'incorrect' | 'manual'
  -- correct: AI가 정확히 감지
  -- partial: 일부만 맞음
  -- incorrect: 완전히 틀림
  -- manual: 사용자가 직접 추가

  -- 메타데이터
  model_version VARCHAR(50) NOT NULL DEFAULT 'mobilenet-v2',
  processing_time_ms INTEGER,  -- 분석 소요 시간

  -- 데이터 사용 동의
  consent_given BOOLEAN NOT NULL DEFAULT false,  -- 학습 데이터 사용 동의
  can_use_for_training BOOLEAN NOT NULL DEFAULT false,  -- 실제 학습에 사용 가능 여부

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON ingredient_recognition_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON ingredient_recognition_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON ingredient_recognition_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_consent ON ingredient_recognition_feedback(can_use_for_training) WHERE can_use_for_training = true;

-- RLS 정책
ALTER TABLE ingredient_recognition_feedback ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 피드백만 조회/생성
CREATE POLICY "Users can view own feedback"
  ON ingredient_recognition_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON ingredient_recognition_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 학습 동의한 데이터 조회 가능 (향후 학습용)
CREATE POLICY "Admins can view training data"
  ON ingredient_recognition_feedback
  FOR SELECT
  USING (
    can_use_for_training = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_ingredient_recognition_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ingredient_recognition_feedback_updated_at
  BEFORE UPDATE ON ingredient_recognition_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredient_recognition_feedback_updated_at();
