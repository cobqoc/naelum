-- 노하우(요리 팁) 테이블
CREATE TABLE IF NOT EXISTS knowhow (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  thumbnail_url text,
  category varchar(50) NOT NULL DEFAULT '기타',
  duration_minutes integer,
  is_public boolean DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 노하우 단계
CREATE TABLE IF NOT EXISTS knowhow_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  knowhow_id uuid REFERENCES knowhow(id) ON DELETE CASCADE NOT NULL,
  step_number integer NOT NULL,
  instruction text NOT NULL,
  tip text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 노하우 태그
CREATE TABLE IF NOT EXISTS knowhow_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  knowhow_id uuid REFERENCES knowhow(id) ON DELETE CASCADE NOT NULL,
  tag varchar(100) NOT NULL
);

-- RLS
ALTER TABLE knowhow ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowhow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowhow_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public knowhow readable" ON knowhow FOR SELECT USING (is_public = true OR auth.uid() = author_id);
CREATE POLICY "Author insert knowhow" ON knowhow FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author update knowhow" ON knowhow FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Author delete knowhow" ON knowhow FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Steps readable" ON knowhow_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM knowhow WHERE id = knowhow_id AND (is_public = true OR author_id = auth.uid()))
);
CREATE POLICY "Author manages steps" ON knowhow_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM knowhow WHERE id = knowhow_id AND author_id = auth.uid())
);

CREATE POLICY "Tags readable" ON knowhow_tags FOR SELECT USING (true);
CREATE POLICY "Author manages tags" ON knowhow_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM knowhow WHERE id = knowhow_id AND author_id = auth.uid())
);
