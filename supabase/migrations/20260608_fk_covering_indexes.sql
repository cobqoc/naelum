-- FK 커버링 인덱스 일괄 추가
--
-- 배경: advisor unindexed_foreign_keys — prod 21건. 커버링 인덱스 없는 FK 컬럼은
--   조인·FK 제약 검사·ON DELETE 시 풀스캔. 규모 커질수록 비용 ↑ (RLS 최적화와 짝).
--   특히 핫경로: recipe_posts.user_id, post_likes.user_id, user_ingredients.ingredient_id
--   (냉장고 매칭), shopping_list_items.ingredient_id, notifications.related_* 등.
--
-- 안전성:
--   * CREATE INDEX IF NOT EXISTS → 멱등, 이미 있으면 no-op. 데이터/로직 불변.
--   * 카탈로그에서 *커버링 인덱스 없는 FK* 만 동적 탐지 → 환경(dev/prod) 무관, 전사 오류 0.
--     (int2vector indkey 는 0-based 접근 — 1-based conkey 와 base 불일치 주의.)
--   * 인덱스명 idx_<table>_<col...> (63바이트 truncate). 단일·복합 FK 모두 처리.
--   * prod 테이블 규모 작아 비concurrent CREATE INDEX 의 짧은 write-lock 허용 범위.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass::text AS tbl,
           left('idx_' || c.conrelid::regclass::text || '_' || string_agg(a.attname, '_' ORDER BY k.ord), 63) AS idxname,
           string_agg(quote_ident(a.attname), ', ' ORDER BY k.ord) AS cols
    FROM pg_constraint c
    JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND (
            SELECT array_agg(i.indkey[s] ORDER BY s)
            FROM generate_series(0, array_length(c.conkey, 1) - 1) AS s
          ) = c.conkey
      )
    GROUP BY c.oid, c.conrelid
  LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%s)', r.idxname, r.tbl, r.cols);
    RAISE NOTICE 'created fk index % on %', r.idxname, r.tbl;
  END LOOP;
END $$;
