-- 사용자별 즐겨찾기/자주 사는 재료
-- 자동 집계: user_ingredients / shopping_list_items INSERT 트리거로 add_count++ & last_added_at 갱신
-- 명시적 ⭐: is_starred (사용자 토글)
-- 정렬: starred → add_count → last_added_at
CREATE TABLE IF NOT EXISTS user_favorites_ingredients (
  user_id          UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_name  TEXT         NOT NULL,
  category         VARCHAR(50),
  is_starred       BOOLEAN      NOT NULL DEFAULT FALSE,
  add_count        INTEGER      NOT NULL DEFAULT 1,
  last_added_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, ingredient_name)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites_ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_sorted
  ON user_favorites_ingredients(user_id, is_starred DESC, add_count DESC, last_added_at DESC);

ALTER TABLE user_favorites_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorites_ingredients_own_all" ON user_favorites_ingredients;
CREATE POLICY "user_favorites_ingredients_own_all" ON user_favorites_ingredients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 트리거 함수: 재료 추가 시 자동으로 favorites 갱신
-- NEW.ingredient_name이 빈 문자열·NULL이면 skip
CREATE OR REPLACE FUNCTION upsert_user_favorite_ingredient()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.ingredient_name IS NULL OR length(trim(NEW.ingredient_name)) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO user_favorites_ingredients (user_id, ingredient_name, category, add_count, last_added_at)
  VALUES (NEW.user_id, trim(NEW.ingredient_name), NEW.category, 1, NOW())
  ON CONFLICT (user_id, ingredient_name) DO UPDATE SET
    add_count = user_favorites_ingredients.add_count + 1,
    last_added_at = NOW(),
    category = COALESCE(user_favorites_ingredients.category, EXCLUDED.category);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_user_ingredients_favorite ON user_ingredients;
CREATE TRIGGER trg_user_ingredients_favorite
  AFTER INSERT ON user_ingredients
  FOR EACH ROW EXECUTE FUNCTION upsert_user_favorite_ingredient();

DROP TRIGGER IF EXISTS trg_shopping_list_items_favorite ON shopping_list_items;
CREATE TRIGGER trg_shopping_list_items_favorite
  AFTER INSERT ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION upsert_user_favorite_ingredient();
