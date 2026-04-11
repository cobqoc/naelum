CREATE TABLE contact_inquiries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email       TEXT,
  category    VARCHAR(20) NOT NULL DEFAULT 'other',
  content     TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 누구나 삽입 가능 (비로그인 포함)
CREATE POLICY "Anyone can submit inquiry"
  ON contact_inquiries FOR INSERT
  WITH CHECK (true);

-- 본인 문의만 조회
CREATE POLICY "Users can view own inquiries"
  ON contact_inquiries FOR SELECT
  USING (auth.uid() = user_id);
