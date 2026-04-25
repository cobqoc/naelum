-- Admin role 검증을 auth.users.raw_user_meta_data 에서 profiles.role 로 통일
-- raw_user_meta_data 는 Supabase 메타데이터와 profiles 간 동기화가 보장되지 않음

-- ingredient_recognition_feedback
DROP POLICY IF EXISTS "Admins can view training data" ON ingredient_recognition_feedback;
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

-- ingredient_training_data
DROP POLICY IF EXISTS "Admins can view all training data" ON ingredient_training_data;
CREATE POLICY "Admins can view all training data"
  ON ingredient_training_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update training data" ON ingredient_training_data;
CREATE POLICY "Admins can update training data"
  ON ingredient_training_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
