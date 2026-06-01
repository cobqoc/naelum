-- 재료 마스터 확충 (2026-06-02)
-- 출처: published 레시피 재료 중 마스터 미연결 291종 분석 → 본질 기준 분류.
-- 신규 카테고리 3종: bakery(빵류), alcohol(요리용 술), seeds(씨앗·유지종자)
--   사용자 결정(2026-06-02): 토마토→veggie, 빵→bakery신설, 요리주→alcohol신설, 깨→seeds신설, 매실액→sweetener
-- 매칭 모델 주의 (matchV2.ts):
--   - base_ingredient_id = is-a 변형 (멥쌀 is-a 쌀). 단방향: 변형 보유 → base 필요 충족.
--   - preparable_to 관계 = raw→processed (쌀→밥). 원물 보유 → 가공 필요 충족. ★ 냉장고 use-case 방향.
--   가공/조리 형태(밥·다진X·즙류)는 반드시 preparable_to 로 — base 로 넣으면 방향이 반대라 안 켜짐.
-- dev(jmyrdoguxlizvajfcwep) 선적용·검증 완료. prod(rgnlgpfazxgwsnkgrhzs) 미적용.

BEGIN;

-- ============================================================
-- BLOCK A — 신규 canonical 재료 (base 없음, 원물/완성 재료)
-- ============================================================
INSERT INTO ingredients_master (name, category, is_processed, emoji, aliases) VALUES
  ('고등어','seafood',false,'🐟',ARRAY['mackerel']),
  ('꽁치','seafood',false,'🐟',ARRAY['saury','pacific saury']),
  ('꽃게','seafood',false,'🦀',ARRAY['blue crab']),
  ('전어','seafood',false,'🐟',ARRAY['gizzard shad']),
  ('메기','seafood',false,'🐟',ARRAY['catfish']),
  ('잉어','seafood',false,'🐟',ARRAY['carp']),
  ('송어','seafood',false,'🐟',ARRAY['trout']),
  ('연어','seafood',false,'🐟',ARRAY['연어살','salmon']),
  ('동태','seafood',false,'🐟',ARRAY['명태','pollack','알래스카명태']),
  ('북어','seafood',false,'🐟',ARRAY['건명태','dried pollack']),
  ('굴','seafood',false,'🦪',ARRAY['생굴','oyster']),
  ('모시조개','seafood',false,'🦪',ARRAY['clam']),
  ('홍합','seafood',false,'🦪',ARRAY['mussel']),
  ('바지락','seafood',false,'🦪',ARRAY['바지락살','manila clam']),
  ('낙지','seafood',false,'🐙',ARRAY['낙지다리','small octopus']),
  ('미더덕','seafood',false,null,ARRAY['sea squirt','warty sea squirt']),
  ('전복','seafood',false,'🐚',ARRAY['abalone']),
  ('주꾸미','seafood',false,'🐙',ARRAY['쭈꾸미','webfoot octopus']),
  ('날치알','seafood',false,null,ARRAY['flying fish roe','tobiko']),
  ('가다랑이포','seafood',false,null,ARRAY['가쯔오브시','가츠오부시','bonito flakes','katsuobushi']),
  ('참치','seafood',false,'🐟',ARRAY['tuna']),
  ('토마토','veggie',false,'🍅',ARRAY['tomato']),
  ('고추','veggie',false,'🌶️',ARRAY['chili pepper','green chili']),
  ('미나리','veggie',false,'🌿',ARRAY['water dropwort','minari']),
  ('쑥갓','veggie',false,'🌿',ARRAY['crown daisy']),
  ('단호박','veggie',false,'🎃',ARRAY['kabocha','sweet pumpkin']),
  ('양상추','veggie',false,'🥬',ARRAY['iceberg lettuce']),
  ('상추','veggie',false,'🥬',ARRAY['lettuce']),
  ('어린잎채소','veggie',false,'🥗',ARRAY['샐러드채소','baby greens','salad greens']),
  ('새싹채소','veggie',false,'🌱',ARRAY['새싹','sprouts']),
  ('무순','veggie',false,'🌱',ARRAY['radish sprouts']),
  ('비트','veggie',false,null,ARRAY['beet','beetroot']),
  ('호박잎','veggie',false,null,ARRAY['pumpkin leaves']),
  ('고사리','veggie',false,null,ARRAY['고사리나물','bracken','fernbrake']),
  ('갓','veggie',false,null,ARRAY['mustard greens']),
  ('겨자잎','veggie',false,null,ARRAY['mustard leaf']),
  ('고구마잎','veggie',false,null,ARRAY['sweet potato leaves']),
  ('우엉','veggie',false,null,ARRAY['burdock','burdock root']),
  ('죽순','veggie',false,null,ARRAY['bamboo shoot']),
  ('숙주','veggie',false,'🌱',ARRAY['숙주나물','mung bean sprouts']),
  ('시래기','veggie',false,null,ARRAY['dried radish greens']),
  ('도라지','veggie',false,null,ARRAY['도라지나물','bellflower root','balloon flower root']),
  ('셀러리','veggie',false,null,ARRAY['샐러리','celery']),
  ('아스파라거스','veggie',false,null,ARRAY['asparagus']),
  ('치커리','veggie',false,null,ARRAY['chicory']),
  ('트레비소','veggie',false,null,ARRAY['treviso','radicchio']),
  ('쪽파','veggie',false,'🌿',ARRAY['실파','chive scallion']),
  ('고구마','veggie',false,'🍠',ARRAY['sweet potato']),
  ('대추','fruit',false,null,ARRAY['jujube','korean date']),
  ('배','fruit',false,'🍐',ARRAY['korean pear','pear']),
  ('라임','fruit',false,'🍋',ARRAY['lime']),
  ('파인애플','fruit',false,'🍍',ARRAY['pineapple']),
  ('건포도','fruit',false,null,ARRAY['raisin','raisins']),
  ('건블루베리','fruit',false,'🫐',ARRAY['dried blueberry']),
  ('레몬','fruit',false,'🍋',ARRAY['lemon']),
  ('사골','meat',false,null,ARRAY['beef bone','marrow bone']),
  ('소꼬리','meat',false,null,ARRAY['oxtail']),
  ('닭발','meat',false,null,ARRAY['chicken feet']),
  ('버섯','mushroom',false,'🍄',ARRAY['mushroom']),
  ('목이버섯','mushroom',false,'🍄',ARRAY['wood ear mushroom']),
  ('콩','legume',false,'🫘',ARRAY['메주콩','서리태콩','서리태','soybean','beans']),
  ('완두콩','legume',false,'🫛',ARRAY['green peas','peas']),
  ('녹두','legume',false,null,ARRAY['mung bean']),
  ('콩비지','legume',false,null,ARRAY['soybean pulp','okara']),
  ('콩가루','legume',false,null,ARRAY['날콩가루','soybean flour']),
  ('청포묵','legume',false,null,ARRAY['mung bean jelly']),
  ('당면','grain',false,null,ARRAY['glass noodles','sweet potato noodles']),
  ('스파게티','grain',false,'🍝',ARRAY['스파게티면','파스타','pasta','spaghetti']),
  ('우동면','grain',false,null,ARRAY['udon noodles']),
  ('쫄면','grain',false,null,ARRAY['chewy noodles']),
  ('냉면','grain',false,null,ARRAY['cold noodles','naengmyeon noodles']),
  ('떡국떡','grain',false,null,ARRAY['rice cake slices','tteokguk tteok']),
  ('귀리','grain',false,null,ARRAY['oats','oat']),
  ('전분','grain',false,null,ARRAY['녹말가루','starch','corn starch','감자전분']),
  ('찹쌀가루','grain',false,null,ARRAY['glutinous rice flour']),
  ('라이스페이퍼','grain',false,null,ARRAY['rice paper']),
  ('만두피','grain',false,null,ARRAY['dumpling wrapper']),
  ('부침가루','grain',false,null,ARRAY['korean pancake mix']),
  ('튀김가루','grain',false,null,ARRAY['frying batter mix','tempura flour']),
  ('파마산치즈','dairy',false,'🧀',ARRAY['파마르산치즈','파마산치즈가루','parmesan']),
  ('그라나빠다노','dairy',false,'🧀',ARRAY['grana padano']),
  ('에멘탈치즈','dairy',false,'🧀',ARRAY['에멘탈치즈가루','emmental']),
  ('플레인요구르트','dairy',false,null,ARRAY['plain yogurt']),
  ('그릭요거트','dairy',false,null,ARRAY['greek yogurt']),
  ('올리브유','oil',false,'🫒',ARRAY['올리브오일','olive oil']),
  ('고추기름','oil',false,null,ARRAY['chili oil']),
  ('코코넛오일','oil',false,null,ARRAY['coconut oil']),
  ('포도씨유','oil',false,null,ARRAY['grapeseed oil']),
  ('바질','spice',false,'🌿',ARRAY['바질가루','basil']),
  ('로즈마리','spice',false,'🌿',ARRAY['rosemary']),
  ('카레가루','spice',false,null,ARRAY['curry powder']),
  ('오레가노','spice',false,'🌿',ARRAY['oregano']),
  ('타임','spice',false,'🌿',ARRAY['thyme']),
  ('월계수잎','spice',false,'🌿',ARRAY['월계수 잎','bay leaf']),
  ('차이브','spice',false,'🌿',ARRAY['chive']),
  ('파슬리','spice',false,'🌿',ARRAY['이태리파슬리','파슬리가루','parsley','italian parsley']),
  ('마른고추','spice',false,'🌶️',ARRAY['dried chili']),
  ('민트','spice',false,'🌿',ARRAY['mint','peppermint']),
  ('칠리','spice',false,'🌶️',ARRAY['chili powder','chili flakes']),
  ('와사비','spice',false,null,ARRAY['wasabi']),
  ('허브솔트','spice',false,null,ARRAY['herb salt']),
  ('견과류','nuts',false,'🥜',ARRAY['mixed nuts','nuts']),
  ('아몬드가루','nuts',false,null,ARRAY['almond flour','almond powder']),
  ('깨','seeds',false,null,ARRAY['참깨','통깨','sesame','sesame seeds']),
  ('들깨','seeds',false,null,ARRAY['들깨가루','perilla seed']),
  ('호박씨','seeds',false,null,ARRAY['pumpkin seed','pepita']),
  ('쌈장','fermented',false,null,ARRAY['ssamjang']),
  ('새우젓','fermented',false,null,ARRAY['salted shrimp','saeujeot']),
  ('전어젓갈','fermented',false,null,ARRAY['gizzard shad jeotgal']),
  ('감동젓','fermented',false,null,ARRAY['gamdongjeot']),
  ('단무지','fermented',false,null,ARRAY['절임무','pickled radish','danmuji']),
  ('르뱅발효종','fermented',false,null,ARRAY['르뱅 발효종','levain','sourdough starter']),
  ('물엿','sweetener',false,null,ARRAY['corn syrup','starch syrup']),
  ('매실액','sweetener',false,null,ARRAY['매실청','plum extract syrup']),
  ('알룰로스','sweetener',false,null,ARRAY['allulose']),
  ('마요네즈','condiment',false,null,ARRAY['마요네스','mayonnaise','mayo']),
  ('토마토케첩','condiment',false,null,ARRAY['케첩','케찹','ketchup']),
  ('허니머스타드','condiment',false,null,ARRAY['허니머스터드','머스타드','머드터드','honey mustard','mustard']),
  ('토마토소스','condiment',false,null,ARRAY['tomato sauce']),
  ('토마토페이스트','condiment',false,null,ARRAY['tomato paste']),
  ('바베큐소스','condiment',false,null,ARRAY['바비큐소스','bbq sauce']),
  ('청주','alcohol',false,null,ARRAY['cheongju','rice wine','cooking rice wine']),
  ('화이트와인','alcohol',false,'🍷',ARRAY['white wine']),
  ('레드와인','alcohol',false,'🍷',ARRAY['red wine']),
  ('식빵','bakery',false,'🍞',ARRAY['white bread','bread','sandwich bread']),
  ('모닝빵','bakery',false,'🍞',ARRAY['dinner roll','morning roll']),
  ('카스텔라','bakery',false,'🍰',ARRAY['castella']),
  ('꽃빵','bakery',false,null,ARRAY['flower bun','steamed bun']),
  ('게맛살','processed',true,null,ARRAY['imitation crab','crab stick','맛살'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- BLOCK A2 — 가공/조리 형태 canonical (base 없음. 매칭은 BLOCK C preparable_to 로)
-- ============================================================
INSERT INTO ingredients_master (name, category, is_processed) VALUES
  ('밥','grain',true),
  ('쌀밥','grain',true),
  ('불린쌀','grain',false),
  ('다진고추','veggie',true),
  ('다진 홍고추','veggie',true),
  ('무채','veggie',true),
  ('당근채','veggie',true),
  ('다진파','veggie',true),
  ('다진쪽파','veggie',true),
  ('다진식파','veggie',true),
  ('깨소금','seeds',true),
  ('배즙','fruit',true),
  ('레몬즙','fruit',true),
  ('사과즙','fruit',true),
  ('다짐육(소고기)','meat',true),
  ('다짐육(돼지고기)','meat',true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- BLOCK B — is-a 변형 (base_ingredient_id). 변형 보유 → base 필요 충족.
-- ============================================================
INSERT INTO ingredients_master (name, category, is_processed, base_ingredient_id)
SELECT v.name, v.category, v.is_processed, b.id
FROM (VALUES
  ('멥쌀','grain',false,'쌀'),
  ('참쌀','grain',false,'찹쌀'),
  ('홍고추','veggie',false,'고추'),
  ('청고추','veggie',false,'고추'),
  ('풋고추','veggie',false,'고추'),
  ('무지개고추','veggie',false,'고추'),
  ('이태리고추','veggie',false,'고추'),
  ('청피망','veggie',false,'피망'),
  ('홍피망','veggie',false,'피망'),
  ('노란 파프리카','veggie',false,'파프리카'),
  ('붉은 파프리카','veggie',false,'파프리카'),
  ('미니파프리카','veggie',false,'파프리카'),
  ('당근잎','veggie',false,'당근'),
  ('배추잎','veggie',false,'배추'),
  ('백오이','veggie',false,'오이'),
  ('둥근호박','veggie',false,'애호박'),
  ('노각','veggie',false,'오이'),
  ('적채','veggie',false,'양배추'),
  ('통파','veggie',false,'대파'),
  ('파뿌리','veggie',false,'대파'),
  ('육수용 대파','veggie',false,'대파'),
  ('육수용 무','veggie',false,'무'),
  ('방울토마토','veggie',false,'토마토'),
  ('오렌지(껍질)','fruit',false,'오렌지'),
  ('돼지등갈비','meat',false,'돼지고기'),
  ('돼지 볼살','meat',false,'돼지고기'),
  ('돼지고기안심','meat',false,'돼지안심'),
  ('슬라이스햄','processed',true,'햄'),
  ('네모난햄','processed',true,'햄'),
  ('대하','seafood',false,'새우'),
  ('생굴','seafood',false,'굴'),
  ('낙지다리','seafood',false,'낙지'),
  ('국물용멸치','seafood',false,'멸치'),
  ('건멸치','seafood',false,'멸치'),
  ('칵테일새우','seafood',true,'새우'),
  ('중새우','seafood',false,'새우'),
  ('잔새우','seafood',false,'새우'),
  ('참치캔','seafood',true,'참치'),
  ('참치통조림','seafood',true,'참치'),
  ('국물용 다시마','seaweed',false,'다시마'),
  ('우무','seaweed',false,'다시마'),
  ('양송이','mushroom',false,'양송이버섯'),
  ('느타리','mushroom',false,'느타리버섯'),
  ('미니새송이버섯','mushroom',false,'새송이버섯'),
  ('모짜렐라치즈','dairy',false,'모짜렐라'),
  ('피자치즈','dairy',true,'모짜렐라'),
  ('슈레드치즈','dairy',true,'모짜렐라'),
  ('저염버터','dairy',false,'버터'),
  ('콩기름','oil',false,'식용유'),
  ('샐러드오일','oil',false,'식용유'),
  ('부침유','oil',false,'식용유'),
  ('신김치','fermented',false,'김치'),
  ('발효초','fermented',false,'식초'),
  ('저염간장','fermented',false,'간장'),
  ('미소된장','fermented',false,'된장'),
  ('흑임자','seeds',false,'깨'),
  ('통후추','spice',false,'후추')
) AS v(name, category, is_processed, basename)
JOIN ingredients_master b ON b.name = v.basename
ON CONFLICT (name) DO NOTHING;

UPDATE ingredients_master SET aliases = COALESCE(aliases,ARRAY[]::text[]) || ARRAY['미소']
WHERE name = '미소된장' AND NOT ('미소' = ANY(COALESCE(aliases,ARRAY[]::text[])));

-- ============================================================
-- BLOCK C — preparable_to 관계 (raw→processed). 원물 보유 → 가공 필요 충족.
-- ★ "쌀 보유 → 밥·불린쌀 요구 레시피 매칭" 의 핵심.
-- ============================================================
INSERT INTO ingredient_relations (from_id, to_id, kind)
SELECT rawm.id, prepm.id, 'preparable_to'
FROM (VALUES
  ('쌀','밥'),('쌀','쌀밥'),('쌀','불린쌀'),
  ('고추','다진고추'),('고추','다진 홍고추'),
  ('무','무채'),('당근','당근채'),
  ('대파','다진파'),('대파','다진쪽파'),('대파','다진식파'),
  ('깨','깨소금'),
  ('배','배즙'),('레몬','레몬즙'),('사과','사과즙'),
  ('소고기','다짐육(소고기)'),('돼지고기','다짐육(돼지고기)')
) AS p(raw, prepared)
JOIN ingredients_master rawm  ON rawm.name  = p.raw
JOIN ingredients_master prepm ON prepm.name = p.prepared
WHERE NOT EXISTS (
  SELECT 1 FROM ingredient_relations r
  WHERE r.from_id=rawm.id AND r.to_id=prepm.id AND r.kind='preparable_to'
);

-- ============================================================
-- BLOCK D — recipe_ingredients 연결 (이름·별칭 정확 매칭으로 ingredient_id 채움)
-- 파싱 쓰레기·브랜드는 매칭 안 됨(NULL 유지) — 의도적.
-- ============================================================
UPDATE recipe_ingredients ri SET ingredient_id = m.id
FROM ingredients_master m
WHERE ri.ingredient_id IS NULL AND btrim(ri.ingredient_name) = m.name;

UPDATE recipe_ingredients ri SET ingredient_id = m.id
FROM ingredients_master m
WHERE ri.ingredient_id IS NULL AND btrim(ri.ingredient_name) = ANY(m.aliases);

COMMIT;
