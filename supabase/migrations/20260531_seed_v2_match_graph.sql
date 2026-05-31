-- V2 매칭 그래프 손큐레이션 시드 — base_id · aliases · relations (2026-05-31)
-- 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8 "남은 갭".
--
-- dev(develop)에서 어드민 UI/수동으로 큐레이션한 그래프가 마이그레이션에 미캡처 →
-- dev 리셋 시 유실 + V2→prod 승격 시 재현 불가 위험을 닫는다. *현재 dev 상태의 박제*.
--
-- 전부 이름 기반(하드코딩 UUID 없음)·additive·재실행 안전:
--   - base_id/aliases: 비어있을 때만 SET (이후 손추가 클로버 안 함)
--   - relations: ON CONFLICT DO NOTHING (substitute reverse 는 trigger 자동)
-- ⚠️ prod(main)에는 V2 스키마 미적용 → dev 대상. V2 승격 시 base_id·ratio 시드와 함께 적용.

-- ============================================================================
-- 1. base_ingredient_id — 변형 → base 분류 링크 (변형 보유 → base 필요 충족)
-- ============================================================================
UPDATE ingredients_master SET base_ingredient_id = (SELECT id FROM ingredients_master WHERE name = '돼지고기')
  WHERE name IN ('목살', '삼겹살') AND base_ingredient_id IS NULL;
UPDATE ingredients_master SET base_ingredient_id = (SELECT id FROM ingredients_master WHERE name = '소고기')
  WHERE name IN ('사태', '차돌박이') AND base_ingredient_id IS NULL;

-- ============================================================================
-- 2. aliases — 이름→id resolution 동의어(한글 변형 + 영문명, 다국어 검색 축)
-- ============================================================================
-- 비어있을 때만 SET — 이후 손추가/언어 확장을 클로버하지 않음.
UPDATE ingredients_master SET aliases = ARRAY['eggplant','aubergine'] WHERE name = '가지' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['soy sauce'] WHERE name = '간장' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['potato','포테이토'] WHERE name = '감자' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['red pepper paste'] WHERE name = '고추장' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['고추가루','red pepper powder'] WHERE name = '고춧가루' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['조선간장','soup soy sauce'] WHERE name = '국간장' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['oyster sauce'] WHERE name = '굴소스' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['perilla leaves'] WHERE name = '깻잎' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['minced ginger'] WHERE name = '다진생강' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['계란','egg','에그'] WHERE name = '달걀' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['치킨','chicken','닭'] WHERE name = '닭고기' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['carrot','캐럿'] WHERE name = '당근' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['파','green onion'] WHERE name = '대파' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['돈육','pork','돼지'] WHERE name = '돼지고기' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['soybean paste'] WHERE name = '된장' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['tofu'] WHERE name = '두부' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['들깨기름','perilla oil'] WHERE name = '들기름' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['피넛','peanut'] WHERE name = '땅콩' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['통마늘','garlic'] WHERE name = '마늘' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['미림','mirin'] WHERE name = '맛술' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['anchovy'] WHERE name = '멸치' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['radish'] WHERE name = '무' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['flour','wheat flour'] WHERE name = '밀가루' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['banana'] WHERE name = '바나나' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['napa cabbage'] WHERE name = '배추' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['white sugar'] WHERE name = '백설탕' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['chives','garlic chives'] WHERE name = '부추' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['broccoli'] WHERE name = '브로콜리' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['apple'] WHERE name = '사과' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['shrimp','prawn'] WHERE name = '새우' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['ginger'] WHERE name = '생강' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['sugar'] WHERE name = '설탕' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['쇠고기','한우','beef'] WHERE name = '소고기' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['salt'] WHERE name = '소금' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['국수','noodle'] WHERE name = '소면' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['spinach'] WHERE name = '시금치' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['cooking oil'] WHERE name = '식용유' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['vinegar'] WHERE name = '식초' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['백미','rice'] WHERE name = '쌀' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['almond'] WHERE name = '아몬드' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['호박','zucchini'] WHERE name = '애호박' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['멸치액젓','까나리액젓','fish sauce'] WHERE name = '액젓' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['cabbage','캐비지'] WHERE name = '양배추' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['onion','어니언'] WHERE name = '양파' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['orange'] WHERE name = '오렌지' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['cucumber'] WHERE name = '오이' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['squid'] WHERE name = '오징어' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['oligosaccharide'] WHERE name = '올리고당' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['milk','밀크'] WHERE name = '우유' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['mixed grains','multigrain'] WHERE name = '잡곡' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['pine nut'] WHERE name = '잣' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['양조간장','dark soy sauce'] WHERE name = '진간장' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['sesame oil'] WHERE name = '참기름' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['glutinous rice','sticky rice'] WHERE name = '찹쌀' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['hot pepper'] WHERE name = '청양고추' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['bean sprouts'] WHERE name = '콩나물' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['paprika','bell pepper'] WHERE name = '파프리카' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['green pepper'] WHERE name = '피망' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['brown rice'] WHERE name = '현미' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['깐호두','walnut'] WHERE name = '호두' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['brown sugar'] WHERE name = '황설탕' AND (aliases IS NULL OR cardinality(aliases) = 0);
UPDATE ingredients_master SET aliases = ARRAY['후춧가루','pepper'] WHERE name = '후추' AND (aliases IS NULL OR cardinality(aliases) = 0);

-- ============================================================================
-- 3. ingredient_relations — preparable_to(단방향) + substitute(양방향, reverse 자동)
-- ============================================================================
-- preparable_to: raw → processed (사용자가 raw 보유 → processed 필요 충족). 단방향.
INSERT INTO ingredient_relations (from_id, to_id, kind, source)
SELECT f.id, t.id, 'preparable_to', 'admin'
FROM ingredients_master f, ingredients_master t
WHERE (f.name, t.name) IN (VALUES ('마늘','편마늘'), ('마늘','다진마늘'), ('생강','다진생강'), ('양파','다진양파'))
ON CONFLICT (from_id, to_id, kind) DO NOTHING;

-- substitute: 양방향(한 방향 INSERT → trigger 가 reverse 자동 생성). 당류 대체쌍.
--   꿀↔설탕(ratio 0.75 는 20260531_seed_unit_coeffs_and_ratios.sql 에서), 백설탕·황설탕·설탕 1:1.
INSERT INTO ingredient_relations (from_id, to_id, kind, source)
SELECT f.id, t.id, 'substitute', 'admin'
FROM ingredients_master f, ingredients_master t
WHERE (f.name, t.name) IN (VALUES ('꿀','설탕'), ('백설탕','설탕'), ('백설탕','황설탕'), ('설탕','황설탕'))
ON CONFLICT (from_id, to_id, kind) DO NOTHING;
