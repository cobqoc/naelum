-- ================================================
-- Feature Additions Migration
-- 2FA Support, Nutrition Tracking, Recipe Remix Enhancement,
-- Personalization Learning, Cookie Consent
-- Date: 2026-04-05
-- ================================================

-- ================================================
-- 1. Remove email_notifications column from profiles
-- ================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS email_notifications;

-- ================================================
-- 2. Add cookie_consent to profiles
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cookie_consent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cookie_consent BOOLEAN DEFAULT NULL;
  END IF;
END $$;

-- ================================================
-- 3. 2FA Support - user_totp_secrets table
-- ================================================

CREATE TABLE IF NOT EXISTS user_totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_totp_secrets_user_id ON user_totp_secrets(user_id);

ALTER TABLE user_totp_secrets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_totp_secrets' AND policyname = 'Users manage own TOTP secrets'
  ) THEN
    CREATE POLICY "Users manage own TOTP secrets"
      ON user_totp_secrets FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ================================================
-- 4. Nutrition Tracking - nutrition_goals table
-- ================================================

CREATE TABLE IF NOT EXISTS nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_calories INTEGER DEFAULT 2000,
  daily_protein_grams DECIMAL(6,1) DEFAULT 50,
  daily_carbs_grams DECIMAL(6,1) DEFAULT 250,
  daily_fat_grams DECIMAL(6,1) DEFAULT 65,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_goals' AND policyname = 'Users manage own nutrition goals'
  ) THEN
    CREATE POLICY "Users manage own nutrition goals"
      ON nutrition_goals FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ================================================
-- 5. Nutrition Tracking - daily_nutrition_logs table
-- ================================================

CREATE TABLE IF NOT EXISTS daily_nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings DECIMAL(4,1) DEFAULT 1,
  calories INTEGER,
  protein_grams DECIMAL(6,1),
  carbs_grams DECIMAL(6,1),
  fat_grams DECIMAL(6,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date, recipe_id, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_nutrition_logs_user_date ON daily_nutrition_logs(user_id, log_date);

ALTER TABLE daily_nutrition_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_nutrition_logs' AND policyname = 'Users manage own nutrition logs'
  ) THEN
    CREATE POLICY "Users manage own nutrition logs"
      ON daily_nutrition_logs FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ================================================
-- 6. Recipe Remix Tracking Enhancement
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'remix_count'
  ) THEN
    ALTER TABLE recipes ADD COLUMN remix_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ================================================
-- 7. Personalization Learning - recommendation_history enhancements
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recommendation_history' AND column_name = 'interaction_weight'
  ) THEN
    ALTER TABLE recommendation_history ADD COLUMN interaction_weight DECIMAL(3,2) DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recommendation_history' AND column_name = 'session_duration_seconds'
  ) THEN
    ALTER TABLE recommendation_history ADD COLUMN session_duration_seconds INTEGER;
  END IF;
END $$;
