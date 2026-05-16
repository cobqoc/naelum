-- 레시피 하위 테이블(recipe_ingredients/recipe_steps/recipe_tags) owner 쓰기 RLS 정책
--
-- 배경: 20260413_sync_rls_policies_to_dev.sql 가 이 세 테이블에 *_public_read
-- (SELECT) 정책만 생성. RLS 는 enabled 인데 INSERT/UPDATE/DELETE 정책이 없어
-- authenticated 유저의 쓰기가 전부 거부됐다. POST/PUT /api/recipes 는 .error 를
-- 확인하지 않아 조용히 success 반환 → 유저가 앱에서 만든/수정한 레시피의
-- 재료·단계·태그가 통째로 유실. 기존 1,443개 레시피는 service-role 임포트
-- 스크립트(RLS 우회)로 들어와 잠복했던 버그. (dev+prod 동일 상태에서 확인)
--
-- 정책: 부모 recipes 행의 author_id = auth.uid() 일 때만 하위 행 쓰기 허용.
-- recipes 테이블 기존 정책(auth.uid() = author_id, role public)과 동일 스타일.
-- DROP IF EXISTS → CREATE 로 idempotent (dev 적용 후 prod 재적용 안전).

-- ── recipe_ingredients ──────────────────────────────────────────────
DROP POLICY IF EXISTS "recipe_ingredients_owner_insert" ON recipe_ingredients;
CREATE POLICY "recipe_ingredients_owner_insert" ON recipe_ingredients
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS "recipe_ingredients_owner_update" ON recipe_ingredients;
CREATE POLICY "recipe_ingredients_owner_update" ON recipe_ingredients
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.author_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS "recipe_ingredients_owner_delete" ON recipe_ingredients;
CREATE POLICY "recipe_ingredients_owner_delete" ON recipe_ingredients
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.author_id = auth.uid()
  ));

-- ── recipe_steps ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "recipe_steps_owner_insert" ON recipe_steps;
CREATE POLICY "recipe_steps_owner_insert" ON recipe_steps
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_steps.recipe_id AND r.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS "recipe_steps_owner_update" ON recipe_steps;
CREATE POLICY "recipe_steps_owner_update" ON recipe_steps
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_steps.recipe_id AND r.author_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_steps.recipe_id AND r.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS "recipe_steps_owner_delete" ON recipe_steps;
CREATE POLICY "recipe_steps_owner_delete" ON recipe_steps
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_steps.recipe_id AND r.author_id = auth.uid()
  ));

-- ── recipe_tags ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "recipe_tags_owner_insert" ON recipe_tags;
CREATE POLICY "recipe_tags_owner_insert" ON recipe_tags
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_tags.recipe_id AND r.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS "recipe_tags_owner_update" ON recipe_tags;
CREATE POLICY "recipe_tags_owner_update" ON recipe_tags
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_tags.recipe_id AND r.author_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_tags.recipe_id AND r.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS "recipe_tags_owner_delete" ON recipe_tags;
CREATE POLICY "recipe_tags_owner_delete" ON recipe_tags
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_tags.recipe_id AND r.author_id = auth.uid()
  ));
