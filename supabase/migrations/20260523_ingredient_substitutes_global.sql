-- 어드민 승격 대체재 표 — recipe_ingredients.substitutes 누적 패턴을 어드민이
-- 검토 후 전역 매칭에 추가하기 위한 테이블. 코드 상수(INGREDIENT_SUBSTITUTES)는
-- 그대로 두고, DB 행은 server-side 추천 매칭에서 머지해서 사용.
--
-- 양방향: 단방향 row 1개로 저장(from→to), 코드에서 양쪽 조회.
-- 중복 방지: UNIQUE (from_name, to_name).

CREATE TABLE IF NOT EXISTS ingredient_substitutes_global (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_name        text NOT NULL,
  to_name          text NOT NULL,
  source           text NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'pattern_promoted')),
  suggestion_count integer NOT NULL DEFAULT 1,
  approved_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ingredient_substitutes_global_pair_unique UNIQUE (from_name, to_name),
  CONSTRAINT ingredient_substitutes_global_not_self CHECK (from_name <> to_name)
);

CREATE INDEX IF NOT EXISTS idx_substitutes_from_name ON ingredient_substitutes_global(from_name);
CREATE INDEX IF NOT EXISTS idx_substitutes_to_name   ON ingredient_substitutes_global(to_name);

-- RLS
ALTER TABLE ingredient_substitutes_global ENABLE ROW LEVEL SECURITY;

-- public 읽기 — 매칭에 필요
DROP POLICY IF EXISTS "substitutes_global_select" ON ingredient_substitutes_global;
CREATE POLICY "substitutes_global_select" ON ingredient_substitutes_global
  FOR SELECT TO public USING (true);

-- admin 만 쓰기
DROP POLICY IF EXISTS "substitutes_global_admin_insert" ON ingredient_substitutes_global;
CREATE POLICY "substitutes_global_admin_insert" ON ingredient_substitutes_global
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "substitutes_global_admin_delete" ON ingredient_substitutes_global;
CREATE POLICY "substitutes_global_admin_delete" ON ingredient_substitutes_global
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

COMMENT ON TABLE ingredient_substitutes_global IS '어드민 승격 대체재 매핑. 코드 상수 INGREDIENT_SUBSTITUTES와 머지해서 추천 매칭에 사용.';
