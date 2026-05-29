-- V2 재료 매칭 시스템 — 본질 재설계 (2026-05-29)
--
-- 설계 문서: docs/INGREDIENT_MATCHING_REDESIGN.md
-- 메모리: [[ingredient-match-v2-redesign]]
--
-- 핵심 변화:
--   1. 매칭 데이터를 코드 상수 → DB 그래프로 (ingredient_relations 신규)
--   2. 양방향 (substitute) + 단방향 (preparable_to) 두 종류만 명확히
--   3. 양방향 자동 보장 trigger (한 방향 INSERT → 반대 자동 INSERT)
--   4. 사용자 입력 기반 데이터 축적 (작성자 substitutes → 어드민 승급)
--   5. 조리 도구 별도 테이블 (cooking_tools)
--
-- 옛 시스템 (코드 상수 INGREDIENT_ALIASES·SUBSTITUTES·PREPARABLE_TO·ALLERGEN_SYNONYMS)는
-- Phase 2(코드 V2 작성)에서 deprecate. 본 마이그레이션은 *스키마만* 추가.
-- ingredient_substitutes_global 테이블은 본 ingredient_relations 로 흡수되어 deprecated.

-- ============================================================================
-- 1. ingredient_relations — 매칭 그래프
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingredient_relations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id           uuid NOT NULL REFERENCES ingredients_master(id) ON DELETE CASCADE,
  to_id             uuid NOT NULL REFERENCES ingredients_master(id) ON DELETE CASCADE,
  kind              text NOT NULL CHECK (kind IN ('substitute', 'preparable_to')),
  -- 'substitute': 양방향 대체 (액젓끼리, 케첩↔토마토소스 등) — trigger로 reverse row 자동
  -- 'preparable_to': 단방향 가공 (마늘 → 다진마늘) — raw → processed, 역방향 X
  source            text NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'author_suggestion', 'auto')),
  -- 'admin': 어드민 직접 입력
  -- 'author_suggestion': 작성자가 레시피에 입력 → 어드민 승급
  -- 'auto': 자동 추정 (향후 ML 등)
  suggestion_count  integer NOT NULL DEFAULT 1,  -- 작성자 누적 카운트 (승급 후보 정렬용)
  notes             text,                        -- 어드민 메모 (예: "양조 방식 다름")
  approved_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT relations_pair_unique UNIQUE (from_id, to_id, kind),
  CONSTRAINT relations_not_self CHECK (from_id <> to_id)
);

CREATE INDEX IF NOT EXISTS idx_relations_from ON ingredient_relations(from_id);
CREATE INDEX IF NOT EXISTS idx_relations_to ON ingredient_relations(to_id);
CREATE INDEX IF NOT EXISTS idx_relations_kind ON ingredient_relations(kind);

COMMENT ON TABLE ingredient_relations IS
  'V2 매칭 그래프 — substitute(양방향, trigger로 reverse 자동) + preparable_to(단방향). 이름 매칭/정규화 제거하고 FK 기반 정확 매칭. 옛 ingredient_substitutes_global 흡수.';

COMMENT ON COLUMN ingredient_relations.kind IS
  'substitute: 서로 바꿔 쓸 수 있음(양방향) / preparable_to: from→to 가공 가능(단방향, 통마늘→다진마늘)';

-- ----------------------------------------------------------------------------
-- 양방향 substitute trigger — 한 방향 INSERT 시 reverse row 자동 생성
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ensure_reverse_substitute() RETURNS TRIGGER AS $$
BEGIN
  -- substitute (양방향) 만 reverse 자동 생성. preparable_to 는 단방향이라 제외.
  IF NEW.kind = 'substitute' THEN
    INSERT INTO ingredient_relations (
      from_id, to_id, kind, source, suggestion_count, notes, approved_by, approved_at
    ) VALUES (
      NEW.to_id, NEW.from_id, 'substitute', NEW.source, NEW.suggestion_count,
      NEW.notes, NEW.approved_by, NEW.approved_at
    )
    ON CONFLICT (from_id, to_id, kind) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_reverse_substitute ON ingredient_relations;
CREATE TRIGGER auto_reverse_substitute
AFTER INSERT ON ingredient_relations
FOR EACH ROW
EXECUTE FUNCTION ensure_reverse_substitute();

-- ----------------------------------------------------------------------------
-- RLS — 읽기는 public, 쓰기는 admin
-- ----------------------------------------------------------------------------

ALTER TABLE ingredient_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "relations_select" ON ingredient_relations;
CREATE POLICY "relations_select" ON ingredient_relations
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "relations_admin_insert" ON ingredient_relations;
CREATE POLICY "relations_admin_insert" ON ingredient_relations
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "relations_admin_update" ON ingredient_relations;
CREATE POLICY "relations_admin_update" ON ingredient_relations
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "relations_admin_delete" ON ingredient_relations;
CREATE POLICY "relations_admin_delete" ON ingredient_relations
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================================================
-- 2. cooking_tools — 조리 도구 (요리 도감 Phase 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cooking_tools (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  name_en       text,
  category      text NOT NULL,
  -- 'pot' (냄비), 'pan' (팬), 'knife' (칼), 'oven' (오븐), 'mixer' (믹서),
  -- 'measuring' (계량), 'grinder' (분쇄기), 'baking' (베이킹), 'utensil' (기타),
  -- 'electric' (전자), 'storage' (보관), 'other'
  aliases       text[] DEFAULT '{}',
  description   text,
  usage_tips    text,
  alternatives  text[],
  emoji         text,
  image_url     text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  data_source   text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  approved_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tools_category ON cooking_tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_status ON cooking_tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_name ON cooking_tools(name);

COMMENT ON TABLE cooking_tools IS
  '조리 도구 마스터 — 요리 도감 Phase 2. ingredients_master 와 같은 패턴 (사용자 입력 → pending → 어드민 검수). 매칭 시스템과 독립.';

ALTER TABLE cooking_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tools_select" ON cooking_tools;
CREATE POLICY "tools_select" ON cooking_tools
  FOR SELECT TO public USING (status = 'approved' OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tools_user_insert" ON cooking_tools;
CREATE POLICY "tools_user_insert" ON cooking_tools
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);  -- 로그인 사용자 누구나 pending 추가

DROP POLICY IF EXISTS "tools_admin_update" ON cooking_tools;
CREATE POLICY "tools_admin_update" ON cooking_tools
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "tools_admin_delete" ON cooking_tools;
CREATE POLICY "tools_admin_delete" ON cooking_tools
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================================================
-- 3. ingredients_master — V2 사용자 입력 흐름 강화
-- ============================================================================

-- 사용자 입력 시 RLS — 로그인 사용자가 pending 으로 추가 가능
DROP POLICY IF EXISTS "ingredients_user_insert_pending" ON ingredients_master;
CREATE POLICY "ingredients_user_insert_pending" ON ingredients_master
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND status = 'pending'
    AND data_source = 'user_added'
  );

-- data_source 값 표준화 코멘트
COMMENT ON COLUMN ingredients_master.data_source IS
  'admin | user_added | hansik_api | rda_manual | open_food_facts | recipe_extract(deprecated) — V2 신규는 user_added';

-- ============================================================================
-- 4. ingredient_substitutes_global — DEPRECATED (V2 ingredient_relations 로 흡수)
-- ============================================================================
-- 본 테이블은 본 마이그레이션 후 deprecated. V2 코드 전환 후 별도 삭제 마이그레이션.
-- 지금은 옛 시스템과 *공존* — 추천 API 가 양쪽 다 lookup 하다 V2 완성 후 옛 코드 제거.

COMMENT ON TABLE ingredient_substitutes_global IS
  'DEPRECATED (2026-05-29 V2 마이그레이션) — ingredient_relations 로 흡수. V2 코드 전환 후 삭제 예정.';
