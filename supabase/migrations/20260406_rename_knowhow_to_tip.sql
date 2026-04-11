-- knowhow 테이블명을 tip으로 변경

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Public knowhow readable" ON knowhow;
DROP POLICY IF EXISTS "Author insert knowhow" ON knowhow;
DROP POLICY IF EXISTS "Author update knowhow" ON knowhow;
DROP POLICY IF EXISTS "Author delete knowhow" ON knowhow;
DROP POLICY IF EXISTS "Steps readable" ON knowhow_steps;
DROP POLICY IF EXISTS "Author manages steps" ON knowhow_steps;
DROP POLICY IF EXISTS "Tags readable" ON knowhow_tags;
DROP POLICY IF EXISTS "Author manages tags" ON knowhow_tags;

-- 테이블명 변경
ALTER TABLE knowhow RENAME TO tip;
ALTER TABLE knowhow_steps RENAME TO tip_steps;
ALTER TABLE knowhow_tags RENAME TO tip_tags;

-- 컬럼명 변경 (FK 컬럼)
ALTER TABLE tip_steps RENAME COLUMN knowhow_id TO tip_id;
ALTER TABLE tip_tags RENAME COLUMN knowhow_id TO tip_id;

-- 새 RLS 정책 생성
CREATE POLICY "Public tip readable" ON tip FOR SELECT USING (is_public = true OR auth.uid() = author_id);
CREATE POLICY "Author insert tip" ON tip FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author update tip" ON tip FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Author delete tip" ON tip FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Tip steps readable" ON tip_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM tip WHERE id = tip_id AND (is_public = true OR author_id = auth.uid()))
);
CREATE POLICY "Author manages tip steps" ON tip_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM tip WHERE id = tip_id AND author_id = auth.uid())
);

CREATE POLICY "Tip tags readable" ON tip_tags FOR SELECT USING (true);
CREATE POLICY "Author manages tip tags" ON tip_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM tip WHERE id = tip_id AND author_id = auth.uid())
);
