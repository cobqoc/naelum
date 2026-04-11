-- 재료 관리 및 크라우드소싱 시스템
-- ingredients_master 테이블에 상태 관리 및 승인 관련 컬럼 추가

-- 1. 컬럼 추가
ALTER TABLE ingredients_master
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- 2. 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ingredients_status ON ingredients_master(status);
CREATE INDEX IF NOT EXISTS idx_ingredients_created_by ON ingredients_master(created_by);
CREATE INDEX IF NOT EXISTS idx_ingredients_created_at ON ingredients_master(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredients_search_count ON ingredients_master(search_count DESC NULLS LAST);

-- 3. 기존 재료는 모두 approved 상태로 설정
UPDATE ingredients_master
SET status = 'approved'
WHERE status IS NULL;

-- 4. Row Level Security (RLS) 활성화
ALTER TABLE ingredients_master ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 삭제 (기존 정책이 있을 경우)
DROP POLICY IF EXISTS "Public can view approved ingredients" ON ingredients_master;
DROP POLICY IF EXISTS "Authenticated users can insert ingredients" ON ingredients_master;
DROP POLICY IF EXISTS "Admins can view all ingredients" ON ingredients_master;
DROP POLICY IF EXISTS "Admins can update ingredients" ON ingredients_master;
DROP POLICY IF EXISTS "Admins can delete ingredients" ON ingredients_master;

-- 6. RLS 정책 생성

-- 6-1. 모든 사용자는 approved 재료만 조회 가능
CREATE POLICY "Public can view approved ingredients"
ON ingredients_master
FOR SELECT
USING (status = 'approved');

-- 6-2. 인증된 사용자는 재료 추가 가능 (pending 상태로)
CREATE POLICY "Authenticated users can insert ingredients"
ON ingredients_master
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND status = 'pending'
);

-- 6-3. 관리자는 모든 재료 조회 가능
CREATE POLICY "Admins can view all ingredients"
ON ingredients_master
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6-4. 관리자는 재료 수정 가능
CREATE POLICY "Admins can update ingredients"
ON ingredients_master
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6-5. 관리자는 재료 삭제 가능
CREATE POLICY "Admins can delete ingredients"
ON ingredients_master
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 7. 코멘트 추가
COMMENT ON COLUMN ingredients_master.status IS '재료 상태: pending (승인 대기), approved (승인됨), rejected (거부됨)';
COMMENT ON COLUMN ingredients_master.created_by IS '재료를 추가한 사용자 ID';
COMMENT ON COLUMN ingredients_master.created_at IS '재료 추가 일시';
COMMENT ON COLUMN ingredients_master.approved_by IS '재료를 승인/거부한 관리자 ID';
COMMENT ON COLUMN ingredients_master.approved_at IS '재료 승인/거부 일시';
