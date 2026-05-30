-- 재료 분류 계층 — base_ingredient_id (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §3·§8 Phase 1
--
-- "이 재료는 <base>의 한 종류" 단일-부모 분류. 변형(삼겹살) 보유 → base(돼지고기)
-- 필요 레시피 충족(matchV2 변형 분기). 단방향: 변형→base만, base→변형은 missing.
--
-- additive·degrade-safe: null 기본 = 기존 동작 동일.
-- 무결성: 자기참조 CHECK 로 강제. 다단계 금지·순환 방지는 어드민 write 레이어 가드(별도).

ALTER TABLE ingredients_master
  ADD COLUMN IF NOT EXISTS base_ingredient_id uuid REFERENCES ingredients_master(id) ON DELETE SET NULL;

-- 자기참조 차단 (A.base = A 금지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_master_base_not_self'
  ) THEN
    ALTER TABLE ingredients_master
      ADD CONSTRAINT ingredients_master_base_not_self
      CHECK (base_ingredient_id IS NULL OR base_ingredient_id <> id);
  END IF;
END $$;

-- "돼지고기의 모든 변형" 역조회 + 매칭 fetch 용
CREATE INDEX IF NOT EXISTS idx_ingredients_master_base
  ON ingredients_master(base_ingredient_id)
  WHERE base_ingredient_id IS NOT NULL;
