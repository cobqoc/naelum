-- 장보기 리스트 테이블
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'other',
  quantity DECIMAL,
  unit VARCHAR(20),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_title TEXT,
  is_checked BOOLEAN DEFAULT false,
  is_owned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_user ON shopping_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_checked ON shopping_list_items(user_id, is_checked);

ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopping list"
  ON shopping_list_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 주간 식단 플래너 테이블
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  recipe_title TEXT NOT NULL,
  recipe_thumbnail TEXT,
  plan_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, plan_date);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meal plans"
  ON meal_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
