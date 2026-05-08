/**
 * Open Food Facts ingredient taxonomy → ingredients_master 보강
 *
 * 두 가지 역할:
 *   1. 글로벌 재료 추가 — 서양·아시아 등 국제 요리 재료 (허브, 치즈, 스파이스 등)
 *   2. 기존 재료 영어 이름 보강 — 내장 매핑 테이블로 name_en 채우기
 *
 * OFF API 조건:
 *   - 키 불필요, 무료
 *   - ODbL 라이선스: 출처 표시 + 개선사항 공유 (영양·재료명은 사실 정보이므로 실질적 제약 적음)
 *   - Rate limit: 과도한 요청 방지를 위해 배치당 500ms 딜레이
 *
 * 실행:
 *   npx tsx scripts/import-off-ingredients.ts          # dev (글로벌 재료 추가)
 *   npx tsx scripts/import-off-ingredients.ts --enrich # dev (기존 재료 영어 이름 보강)
 *   npx tsx scripts/import-off-ingredients.ts --prod   # prod
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const isProd   = process.argv.includes('--prod');
const isEnrich = process.argv.includes('--enrich');

const SUPABASE_URL = isProd
  ? process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = isProd
  ? process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

const OFF_TAXONOMY_URL = 'https://world.openfoodfacts.org/api/v2/taxonomy';
const BATCH_SIZE   = 20;   // 한 번에 조회할 OFF 태그 수
const DELAY_MS     = 600;  // 요청 간 딜레이

// ============================================================
// 글로벌 재료 목록 (OFF en: 태그 기준)
// 카테고리별로 정리 — 국제 레시피에서 자주 쓰이는 재료들
// ============================================================

const GLOBAL_INGREDIENTS: Array<{ tag: string; category: string; name_ko?: string }> = [
  // 허브 (Herbs)
  { tag: 'en:basil',           category: 'seasoning', name_ko: '바질' },
  { tag: 'en:thyme',           category: 'seasoning', name_ko: '타임' },
  { tag: 'en:rosemary',        category: 'seasoning', name_ko: '로즈마리' },
  { tag: 'en:oregano',         category: 'seasoning', name_ko: '오레가노' },
  { tag: 'en:parsley',         category: 'seasoning', name_ko: '파슬리' },
  { tag: 'en:cilantro',        category: 'seasoning', name_ko: '고수' },
  { tag: 'en:dill',            category: 'seasoning', name_ko: '딜' },
  { tag: 'en:mint',            category: 'seasoning', name_ko: '민트' },
  { tag: 'en:tarragon',        category: 'seasoning', name_ko: '타라곤' },
  { tag: 'en:sage',            category: 'seasoning', name_ko: '세이지' },
  { tag: 'en:chives',          category: 'seasoning', name_ko: '차이브' },
  { tag: 'en:bay-leaf',        category: 'seasoning', name_ko: '월계수잎' },
  { tag: 'en:lemongrass',      category: 'seasoning', name_ko: '레몬그라스' },
  { tag: 'en:kaffir-lime-leaf',category: 'seasoning', name_ko: '카피르라임잎' },
  { tag: 'en:epazote',         category: 'seasoning', name_ko: '에파조테' },

  // 스파이스 (Spices)
  { tag: 'en:cumin',              category: 'seasoning', name_ko: '커민' },
  { tag: 'en:coriander',         category: 'seasoning', name_ko: '고수씨' },
  { tag: 'en:turmeric',          category: 'seasoning', name_ko: '강황' },
  { tag: 'en:paprika',           category: 'seasoning', name_ko: '파프리카파우더' },
  { tag: 'en:cayenne-pepper',    category: 'seasoning', name_ko: '카이엔페퍼' },
  { tag: 'en:cinnamon',          category: 'seasoning', name_ko: '시나몬' },
  { tag: 'en:nutmeg',            category: 'seasoning', name_ko: '넛맥' },
  { tag: 'en:clove',             category: 'seasoning', name_ko: '정향' },
  { tag: 'en:cardamom',          category: 'seasoning', name_ko: '카다몬' },
  { tag: 'en:star-anise',        category: 'seasoning', name_ko: '팔각' },
  { tag: 'en:saffron',           category: 'seasoning', name_ko: '사프란' },
  { tag: 'en:fennel-seed',       category: 'seasoning', name_ko: '회향씨' },
  { tag: 'en:fenugreek',         category: 'seasoning', name_ko: '호로파' },
  { tag: 'en:allspice',          category: 'seasoning', name_ko: '올스파이스' },
  { tag: 'en:sumac',             category: 'seasoning', name_ko: '수막' },
  { tag: 'en:za-atar',           category: 'seasoning', name_ko: '자타르' },
  { tag: 'en:garam-masala',      category: 'seasoning', name_ko: '가람마살라' },
  { tag: 'en:curry-powder',      category: 'seasoning', name_ko: '카레가루' },
  { tag: 'en:smoked-paprika',    category: 'seasoning', name_ko: '훈제파프리카' },
  { tag: 'en:chili-flakes',      category: 'seasoning', name_ko: '칠리플레이크' },
  { tag: 'en:black-pepper',      category: 'seasoning', name_ko: '흑후추' },
  { tag: 'en:white-pepper',      category: 'seasoning', name_ko: '흰후추' },

  // 소스 및 조미료
  { tag: 'en:tahini',            category: 'seasoning', name_ko: '타히니' },
  { tag: 'en:harissa',           category: 'seasoning', name_ko: '하리사' },
  { tag: 'en:fish-sauce',        category: 'seasoning', name_ko: '피시소스' },
  { tag: 'en:oyster-sauce',      category: 'seasoning', name_ko: '굴소스' },
  { tag: 'en:hoisin-sauce',      category: 'seasoning', name_ko: '해선장' },
  { tag: 'en:worcestershire-sauce', category: 'seasoning', name_ko: '우스터소스' },
  { tag: 'en:sriracha',          category: 'seasoning', name_ko: '스리라차' },
  { tag: 'en:tabasco',           category: 'seasoning', name_ko: '타바스코' },
  { tag: 'en:balsamic-vinegar',  category: 'seasoning', name_ko: '발사믹식초' },
  { tag: 'en:apple-cider-vinegar', category: 'seasoning', name_ko: '사과식초' },
  { tag: 'en:rice-vinegar',      category: 'seasoning', name_ko: '쌀식초' },
  { tag: 'en:dijon-mustard',     category: 'seasoning', name_ko: '디종머스터드' },
  { tag: 'en:coconut-aminos',    category: 'seasoning', name_ko: '코코넛아미노스' },
  { tag: 'en:miso',              category: 'seasoning', name_ko: '미소' },
  { tag: 'en:ponzu',             category: 'seasoning', name_ko: '폰즈' },
  { tag: 'en:mirin',             category: 'seasoning', name_ko: '미림' },
  { tag: 'en:rice-wine',         category: 'seasoning', name_ko: '쌀술' },

  // 오일
  { tag: 'en:olive-oil',         category: 'seasoning', name_ko: '올리브오일' },
  { tag: 'en:coconut-oil',       category: 'seasoning', name_ko: '코코넛오일' },
  { tag: 'en:avocado-oil',       category: 'seasoning', name_ko: '아보카도오일' },
  { tag: 'en:peanut-oil',        category: 'seasoning', name_ko: '땅콩오일' },
  { tag: 'en:walnut-oil',        category: 'seasoning', name_ko: '호두오일' },
  { tag: 'en:sesame-oil',        category: 'seasoning', name_ko: '참기름' },
  { tag: 'en:truffle-oil',       category: 'seasoning', name_ko: '트러플오일' },
  { tag: 'en:ghee',              category: 'dairy',     name_ko: '기' },

  // 치즈
  { tag: 'en:parmesan',          category: 'dairy', name_ko: '파마산치즈' },
  { tag: 'en:mozzarella',        category: 'dairy', name_ko: '모짜렐라치즈' },
  { tag: 'en:feta',              category: 'dairy', name_ko: '페타치즈' },
  { tag: 'en:ricotta',           category: 'dairy', name_ko: '리코타치즈' },
  { tag: 'en:brie',              category: 'dairy', name_ko: '브리치즈' },
  { tag: 'en:camembert',         category: 'dairy', name_ko: '까망베르치즈' },
  { tag: 'en:gouda',             category: 'dairy', name_ko: '고다치즈' },
  { tag: 'en:cheddar',           category: 'dairy', name_ko: '체다치즈' },
  { tag: 'en:gruyere',           category: 'dairy', name_ko: '그뤼에르치즈' },
  { tag: 'en:mascarpone',        category: 'dairy', name_ko: '마스카포네' },
  { tag: 'en:cream-cheese',      category: 'dairy', name_ko: '크림치즈' },
  { tag: 'en:burrata',           category: 'dairy', name_ko: '부라타치즈' },
  { tag: 'en:halloumi',          category: 'dairy', name_ko: '할루미치즈' },
  { tag: 'en:provolone',         category: 'dairy', name_ko: '프로볼로네치즈' },
  { tag: 'en:gorgonzola',        category: 'dairy', name_ko: '고르곤졸라' },
  { tag: 'en:manchego',          category: 'dairy', name_ko: '만체고치즈' },
  { tag: 'en:pecorino',          category: 'dairy', name_ko: '페코리노치즈' },
  { tag: 'en:cottage-cheese',    category: 'dairy', name_ko: '코티지치즈' },
  { tag: 'en:queso-fresco',      category: 'dairy', name_ko: '케소프레스코' },

  // 파스타 & 곡물
  { tag: 'en:spaghetti',         category: 'grain', name_ko: '스파게티' },
  { tag: 'en:penne',             category: 'grain', name_ko: '펜네' },
  { tag: 'en:fettuccine',        category: 'grain', name_ko: '페투치네' },
  { tag: 'en:rigatoni',          category: 'grain', name_ko: '리가토니' },
  { tag: 'en:fusilli',           category: 'grain', name_ko: '푸실리' },
  { tag: 'en:lasagna',           category: 'grain', name_ko: '라자냐면' },
  { tag: 'en:orzo',              category: 'grain', name_ko: '오르조' },
  { tag: 'en:couscous',          category: 'grain', name_ko: '쿠스쿠스' },
  { tag: 'en:quinoa',            category: 'grain', name_ko: '퀴노아' },
  { tag: 'en:bulgur',            category: 'grain', name_ko: '불구르' },
  { tag: 'en:farro',             category: 'grain', name_ko: '파로' },
  { tag: 'en:polenta',           category: 'grain', name_ko: '폴렌타' },
  { tag: 'en:bread-crumbs',      category: 'grain', name_ko: '빵가루' },
  { tag: 'en:panko',             category: 'grain', name_ko: '판코' },
  { tag: 'en:flour-tortilla',    category: 'grain', name_ko: '밀토르티야' },
  { tag: 'en:corn-tortilla',     category: 'grain', name_ko: '옥수수토르티야' },
  { tag: 'en:pita-bread',        category: 'grain', name_ko: '피타빵' },
  { tag: 'en:naan',              category: 'grain', name_ko: '난' },
  { tag: 'en:phyllo-dough',      category: 'grain', name_ko: '필로반죽' },

  // 육류
  { tag: 'en:lamb',              category: 'meat',    name_ko: '양고기' },
  { tag: 'en:veal',              category: 'meat',    name_ko: '송아지고기' },
  { tag: 'en:turkey',            category: 'meat',    name_ko: '칠면조' },
  { tag: 'en:prosciutto',        category: 'meat',    name_ko: '프로슈토' },
  { tag: 'en:pancetta',          category: 'meat',    name_ko: '판체타' },
  { tag: 'en:chorizo',           category: 'meat',    name_ko: '초리조' },
  { tag: 'en:salami',            category: 'meat',    name_ko: '살라미' },
  { tag: 'en:pepperoni',         category: 'meat',    name_ko: '페퍼로니' },
  { tag: 'en:bacon',             category: 'meat',    name_ko: '베이컨' },
  { tag: 'en:sausage',           category: 'meat',    name_ko: '소시지' },
  { tag: 'en:hot-dog',           category: 'meat',    name_ko: '핫도그' },
  { tag: 'en:ham',               category: 'meat',    name_ko: '햄' },
  { tag: 'en:anchovies',         category: 'seafood', name_ko: '앤초비' },
  { tag: 'en:cod',               category: 'seafood', name_ko: '대구' },
  { tag: 'en:tilapia',           category: 'seafood', name_ko: '틸라피아' },
  { tag: 'en:halibut',           category: 'seafood', name_ko: '광어' },
  { tag: 'en:sea-bass',          category: 'seafood', name_ko: '농어' },
  { tag: 'en:snapper',           category: 'seafood', name_ko: '도미' },
  { tag: 'en:clam',              category: 'seafood', name_ko: '조개' },
  { tag: 'en:lobster',           category: 'seafood', name_ko: '랍스터' },
  { tag: 'en:crab',              category: 'seafood', name_ko: '게' },
  { tag: 'en:scallop',           category: 'seafood', name_ko: '관자' },

  // 채소
  { tag: 'en:zucchini',          category: 'veggie', name_ko: '주키니호박' },
  { tag: 'en:artichoke',         category: 'veggie', name_ko: '아티초크' },
  { tag: 'en:leek',              category: 'veggie', name_ko: '리크' },
  { tag: 'en:fennel',            category: 'veggie', name_ko: '펜넬' },
  { tag: 'en:shallot',           category: 'veggie', name_ko: '샬롯' },
  { tag: 'en:bok-choy',          category: 'veggie', name_ko: '청경채' },
  { tag: 'en:radicchio',         category: 'veggie', name_ko: '라디치오' },
  { tag: 'en:endive',            category: 'veggie', name_ko: '앤다이브' },
  { tag: 'en:arugula',           category: 'veggie', name_ko: '루꼴라' },
  { tag: 'en:watercress',        category: 'veggie', name_ko: '물냉이' },
  { tag: 'en:swiss-chard',       category: 'veggie', name_ko: '근대' },
  { tag: 'en:collard-greens',    category: 'veggie', name_ko: '콜라드그린' },
  { tag: 'en:turnip',            category: 'veggie', name_ko: '순무' },
  { tag: 'en:parsnip',           category: 'veggie', name_ko: '파스닙' },
  { tag: 'en:jicama',            category: 'veggie', name_ko: '히카마' },
  { tag: 'en:butternut-squash',  category: 'veggie', name_ko: '버터넛스쿼시' },
  { tag: 'en:acorn-squash',      category: 'veggie', name_ko: '도토리호박' },
  { tag: 'en:brussels-sprouts',  category: 'veggie', name_ko: '방울양배추' },
  { tag: 'en:okra',              category: 'veggie', name_ko: '오크라' },
  { tag: 'en:tomatillo',         category: 'veggie', name_ko: '토마틸로' },
  { tag: 'en:sun-dried-tomato',  category: 'veggie', name_ko: '선드라이토마토' },
  { tag: 'en:cherry-tomato',     category: 'veggie', name_ko: '방울토마토' },
  { tag: 'en:edamame',           category: 'soy',    name_ko: '에다마메' },
  { tag: 'en:tempeh',            category: 'soy',    name_ko: '템페' },

  // 과일 & 견과류
  { tag: 'en:avocado',           category: 'fruit', name_ko: '아보카도' },
  { tag: 'en:pomegranate',       category: 'fruit', name_ko: '석류' },
  { tag: 'en:fig',               category: 'fruit', name_ko: '무화과' },
  { tag: 'en:passion-fruit',     category: 'fruit', name_ko: '패션프루트' },
  { tag: 'en:dragon-fruit',      category: 'fruit', name_ko: '용과' },
  { tag: 'en:lychee',            category: 'fruit', name_ko: '리치' },
  { tag: 'en:guava',             category: 'fruit', name_ko: '구아바' },
  { tag: 'en:papaya',            category: 'fruit', name_ko: '파파야' },
  { tag: 'en:plantain',          category: 'fruit', name_ko: '플랜틴' },
  { tag: 'en:almond',            category: 'fruit', name_ko: '아몬드' },
  { tag: 'en:cashew',            category: 'fruit', name_ko: '캐슈넛' },
  { tag: 'en:pistachio',         category: 'fruit', name_ko: '피스타치오' },
  { tag: 'en:macadamia',         category: 'fruit', name_ko: '마카다미아' },
  { tag: 'en:pecan',             category: 'fruit', name_ko: '피칸' },
  { tag: 'en:hazelnut',          category: 'fruit', name_ko: '헤이즐넛' },
  { tag: 'en:peanut',            category: 'fruit', name_ko: '땅콩' },
  { tag: 'en:pine-nut',          category: 'fruit', name_ko: '잣' },
  { tag: 'en:sunflower-seed',    category: 'fruit', name_ko: '해바라기씨' },
  { tag: 'en:pumpkin-seed',      category: 'fruit', name_ko: '호박씨' },
  { tag: 'en:flax-seed',         category: 'fruit', name_ko: '아마씨' },
  { tag: 'en:chia-seed',         category: 'fruit', name_ko: '치아씨드' },
  { tag: 'en:hemp-seed',         category: 'fruit', name_ko: '햄프씨드' },

  // 콩류 & 기타
  { tag: 'en:chickpea',          category: 'grain', name_ko: '병아리콩' },
  { tag: 'en:lentil',            category: 'grain', name_ko: '렌틸콩' },
  { tag: 'en:black-bean',        category: 'grain', name_ko: '검은콩' },
  { tag: 'en:kidney-bean',       category: 'grain', name_ko: '강낭콩' },
  { tag: 'en:cannellini-bean',   category: 'grain', name_ko: '카넬리니빈' },
  { tag: 'en:edamame',           category: 'soy',   name_ko: '풋콩' },

  // 기타 글로벌 재료
  { tag: 'en:coconut-milk',      category: 'other', name_ko: '코코넛밀크' },
  { tag: 'en:coconut-cream',     category: 'other', name_ko: '코코넛크림' },
  { tag: 'en:almond-milk',       category: 'dairy', name_ko: '아몬드밀크' },
  { tag: 'en:oat-milk',          category: 'dairy', name_ko: '오트밀크' },
  { tag: 'en:soy-milk',          category: 'soy',   name_ko: '두유' },
  { tag: 'en:truffle',           category: 'other', name_ko: '트러플' },
  { tag: 'en:capers',            category: 'other', name_ko: '케이퍼' },
  { tag: 'en:olives',            category: 'other', name_ko: '올리브' },
  { tag: 'en:sun-dried-tomato',  category: 'veggie', name_ko: '선드라이토마토' },
  { tag: 'en:nutritional-yeast', category: 'other', name_ko: '영양효모' },
  { tag: 'en:bread-yeast',       category: 'other', name_ko: '드라이이스트' },
  { tag: 'en:gelatin',           category: 'other', name_ko: '젤라틴' },
  { tag: 'en:agar-agar',         category: 'other', name_ko: '한천' },
  { tag: 'en:vanilla-bean',      category: 'other', name_ko: '바닐라빈' },
  { tag: 'en:cacao',             category: 'other', name_ko: '카카오' },
  { tag: 'en:cocoa-powder',      category: 'other', name_ko: '코코아파우더' },
  { tag: 'en:matcha',            category: 'other', name_ko: '말차' },
  { tag: 'en:miso-paste',        category: 'seasoning', name_ko: '미소페이스트' },
  { tag: 'en:nori',              category: 'seafood',   name_ko: '김' },
  { tag: 'en:wakame',            category: 'seafood',   name_ko: '미역' },
  { tag: 'en:kombu',             category: 'seafood',   name_ko: '다시마' },
  { tag: 'en:bonito-flakes',     category: 'seafood',   name_ko: '가쓰오부시' },
];

// ============================================================
// 한국어 → 영어 이름 내장 매핑 (기존 재료 name_en 채우기)
// ============================================================

const KO_EN_MAP: Record<string, string> = {
  // 채소
  '배추': 'Napa Cabbage', '무': 'Radish', '양파': 'Onion', '마늘': 'Garlic',
  '고추': 'Chili Pepper', '대파': 'Green Onion', '쪽파': 'Spring Onion',
  '실파': 'Thin Green Onion', '시금치': 'Spinach', '당근': 'Carrot',
  '호박': 'Squash', '애호박': 'Korean Zucchini', '단호박': 'Kabocha Squash',
  '감자': 'Potato', '고구마': 'Sweet Potato', '오이': 'Cucumber',
  '가지': 'Eggplant', '상추': 'Lettuce', '양배추': 'Cabbage',
  '깻잎': 'Perilla Leaf', '부추': 'Garlic Chives', '미나리': 'Water Parsley',
  '쑥갓': 'Crown Daisy', '도라지': 'Balloon Flower Root', '고사리': 'Fern',
  '연근': 'Lotus Root', '우엉': 'Burdock', '두릅': 'Aralia Shoot',
  '브로콜리': 'Broccoli', '콜리플라워': 'Cauliflower', '양상추': 'Iceberg Lettuce',
  '파프리카': 'Bell Pepper', '피망': 'Green Pepper', '청피망': 'Green Capsicum',
  '홍피망': 'Red Capsicum', '방울토마토': 'Cherry Tomato', '토마토': 'Tomato',
  '옥수수': 'Corn', '콩나물': 'Bean Sprouts', '숙주': 'Mung Bean Sprouts',
  '표고버섯': 'Shiitake Mushroom', '느타리버섯': 'Oyster Mushroom',
  '새송이버섯': 'King Oyster Mushroom', '양송이버섯': 'Button Mushroom',
  '팽이버섯': 'Enoki Mushroom', '목이버섯': 'Wood Ear Mushroom',
  '아스파라거스': 'Asparagus', '셀러리': 'Celery', '무순': 'Radish Sprouts',
  '치커리': 'Chicory', '완두콩': 'Peas', '비트': 'Beet',

  // 육류
  '닭고기': 'Chicken', '돼지고기': 'Pork', '소고기': 'Beef', '쇠고기': 'Beef',
  '닭': 'Chicken', '돼지': 'Pork', '소': 'Beef', '양고기': 'Lamb',
  '삼겹살': 'Pork Belly', '갈비': 'Ribs', '안심': 'Tenderloin',
  '등심': 'Sirloin', '목살': 'Pork Neck', '닭가슴살': 'Chicken Breast',
  '닭다리': 'Chicken Leg', '닭날개': 'Chicken Wings', '닭봉': 'Chicken Drumettes',

  // 해산물
  '새우': 'Shrimp', '오징어': 'Squid', '문어': 'Octopus', '낙지': 'Small Octopus',
  '조개': 'Clam', '바지락': 'Short-neck Clam', '홍합': 'Mussel',
  '전복': 'Abalone', '굴': 'Oyster', '꽃게': 'Blue Crab',
  '연어': 'Salmon', '참치': 'Tuna', '고등어': 'Mackerel', '삼치': 'Spanish Mackerel',
  '갈치': 'Hairtail', '대구': 'Cod', '명태': 'Pollock', '황태': 'Dried Pollock',
  '멸치': 'Anchovy', '다시마': 'Kelp', '미역': 'Sea Mustard', '김': 'Laver',
  '어묵': 'Fish Cake', '가다랑어포': 'Katsuobushi', '가쓰오부시': 'Katsuobushi',

  // 곡류·면
  '쌀': 'Rice', '찹쌀': 'Glutinous Rice', '보리': 'Barley', '밀가루': 'Flour',
  '강력분': 'Bread Flour', '박력분': 'Cake Flour', '중력분': 'All-purpose Flour',
  '전분': 'Starch', '녹말': 'Starch', '당면': 'Glass Noodles',
  '소면': 'Thin Wheat Noodles', '우동': 'Udon', '라면': 'Ramen',
  '떡': 'Rice Cake', '가래떡': 'Stick Rice Cake',
  '빵가루': 'Bread Crumbs', '식빵': 'Bread',

  // 양념·소스
  '간장': 'Soy Sauce', '고추장': 'Gochujang', '된장': 'Doenjang',
  '쌈장': 'Ssamjang', '소금': 'Salt', '설탕': 'Sugar', '식초': 'Vinegar',
  '참기름': 'Sesame Oil', '들기름': 'Perilla Oil', '후추': 'Black Pepper',
  '깨': 'Sesame Seeds', '참깨': 'Sesame Seeds', '흑임자': 'Black Sesame',
  '고춧가루': 'Gochugaru (Red Pepper Flakes)', '카레': 'Curry',
  '케첩': 'Ketchup', '마요네즈': 'Mayonnaise', '올리브오일': 'Olive Oil',
  '식용유': 'Cooking Oil', '맛술': 'Mirim', '청주': 'Cheongju (Rice Wine)',
  '미림': 'Mirin', '정종': 'Rice Wine', '굴소스': 'Oyster Sauce',
  '물엿': 'Corn Syrup', '꿀': 'Honey', '매실청': 'Maesil Syrup',
  '고추기름': 'Chili Oil', '들깻가루': 'Ground Perilla', '겨자': 'Mustard',

  // 유제품
  '우유': 'Milk', '버터': 'Butter', '생크림': 'Heavy Cream', '치즈': 'Cheese',
  '요거트': 'Yogurt', '크림치즈': 'Cream Cheese',

  // 두부·콩
  '두부': 'Tofu', '순두부': 'Silken Tofu', '연두부': 'Soft Tofu', '유부': 'Aburaage',
  '콩': 'Beans', '팥': 'Red Beans', '녹두': 'Mung Beans',

  // 달걀
  '달걀': 'Egg', '계란': 'Egg', '메추리알': 'Quail Egg',

  // 과일
  '사과': 'Apple', '배': 'Pear', '감': 'Persimmon', '귤': 'Mandarin',
  '딸기': 'Strawberry', '포도': 'Grape', '수박': 'Watermelon',
  '복숭아': 'Peach', '레몬': 'Lemon', '오렌지': 'Orange',
  '키위': 'Kiwi', '바나나': 'Banana', '망고': 'Mango',
  '파인애플': 'Pineapple', '석류': 'Pomegranate', '매실': 'Plum',
  '대추': 'Jujube', '밤': 'Chestnut', '잣': 'Pine Nut', '호두': 'Walnut',

  // 생강·마늘
  '생강': 'Ginger', '강황': 'Turmeric',
};

// ============================================================
// OFF API 호출
// ============================================================

interface OFFTaxonomyEntry {
  name?: Record<string, string>;
  parents?: string[];
  children?: string[];
  wikidata?: Record<string, string>;
  ciqual_food_code?: Record<string, string>;
}

async function fetchOFFTaxonomy(tags: string[]): Promise<Record<string, OFFTaxonomyEntry>> {
  const url = `${OFF_TAXONOMY_URL}?tagtype=ingredients&tags=${tags.join(',')}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NaelumApp/1.0 (naelum.app; contact: hello@naelum.app)' },
  });
  if (!res.ok) throw new Error(`OFF API 오류: ${res.status}`);
  return res.json();
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// 글로벌 재료 추가
// ============================================================

async function addGlobalIngredients(supabase: ReturnType<typeof createClient>) {
  console.log('\n🌍 글로벌 재료 추가 시작...');

  // 기존 재료명 수집
  const { data: existing } = await supabase
    .from('ingredients_master')
    .select('name, name_ko, name_en');

  const existingByName = new Set<string>();
  const existingByKo   = new Set<string>();
  for (const row of (existing ?? [])) {
    if (row.name)    existingByName.add(row.name.trim());
    if (row.name_ko) existingByKo.add(row.name_ko.trim());
    if (row.name_en) existingByName.add(row.name_en.trim());
  }

  // 태그를 배치로 나눠 처리
  const tags   = GLOBAL_INGREDIENTS.map(i => i.tag);
  const tagMap = new Map(GLOBAL_INGREDIENTS.map(i => [i.tag, i]));

  let inserted = 0, skipped = 0, errors = 0;

  for (let i = 0; i < tags.length; i += BATCH_SIZE) {
    const batch     = tags.slice(i, i + BATCH_SIZE);
    const batchMeta = batch.map(t => tagMap.get(t)!);

    try {
      const taxonomy = await fetchOFFTaxonomy(batch);

      const toInsert = [];
      for (const meta of batchMeta) {
        const entry    = taxonomy[meta.tag] ?? {};
        const nameEn   = entry.name?.en ?? meta.tag.replace('en:', '').replace(/-/g, ' ');
        const nameKo   = meta.name_ko ?? entry.name?.ko;

        // 이미 있으면 스킵 (영어 이름이나 한국어 이름으로 확인)
        if (existingByName.has(nameEn) || (nameKo && existingByKo.has(nameKo))) {
          skipped++;
          continue;
        }

        // 영어 이름을 name으로, 한국어 이름을 name_ko로
        const primaryName = nameKo ?? nameEn;
        if (existingByName.has(primaryName) || existingByKo.has(primaryName)) {
          skipped++;
          continue;
        }

        toInsert.push({
          name:        primaryName,
          name_ko:     nameKo ?? null,
          name_en:     nameEn,
          category:    meta.category,
          common_units: '["g","개"]',
          status:      'approved',
          data_source: 'open_food_facts',
          attribution: 'Open Food Facts (ODbL)',
        });

        existingByName.add(primaryName);
        if (nameKo) existingByKo.add(nameKo);
      }

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('ingredients_master')
          .upsert(toInsert, { onConflict: 'name', ignoreDuplicates: true });

        if (error) {
          console.error(`  ❌ 배치 오류:`, error.message);
          errors += toInsert.length;
        } else {
          inserted += toInsert.length;
        }
      }

      process.stdout.write(`\r  진행: ${Math.min(i + BATCH_SIZE, tags.length)}/${tags.length} | 추가: ${inserted} 스킵: ${skipped}`);
    } catch (err) {
      console.error(`\n  ❌ OFF API 오류:`, err);
      errors += batchMeta.length;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\n  ✅ 글로벌 재료 추가: ${inserted}개 | 스킵(이미 있음): ${skipped}개 | 오류: ${errors}개`);
  return { inserted, skipped, errors };
}

// ============================================================
// 기존 재료 영어 이름 보강
// ============================================================

async function enrichEnglishNames(supabase: ReturnType<typeof createClient>) {
  console.log('\n🔤 기존 재료 영어 이름(name_en) 보강 시작...');

  const { data: rows, error } = await supabase
    .from('ingredients_master')
    .select('id, name, name_ko')
    .is('name_en', null);

  if (error || !rows) {
    console.error('❌ 조회 실패:', error?.message);
    return;
  }
  console.log(`  → name_en 없는 재료: ${rows.length}개`);

  let updated = 0, notFound = 0;

  for (const row of rows) {
    const searchName = row.name_ko ?? row.name;
    const nameEn = KO_EN_MAP[searchName];

    if (!nameEn) {
      notFound++;
      continue;
    }

    const { error: updErr } = await supabase
      .from('ingredients_master')
      .update({ name_en: nameEn })
      .eq('id', row.id);

    if (updErr) {
      console.error(`  ❌ 업데이트 실패 "${searchName}":`, updErr.message);
    } else {
      updated++;
    }
  }

  console.log(`  ✅ name_en 업데이트: ${updated}개 | 매핑 없음: ${notFound}개`);
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('🥕 Open Food Facts 재료 보강');
  console.log(`📦 대상 DB: ${isProd ? '🔴 PROD' : '🟡 DEV'}`);
  console.log(`🎯 모드: ${isEnrich ? '영어 이름 보강 (--enrich)' : '글로벌 재료 추가'}\n`);

  if (isProd) {
    console.log('⚠️  프로덕션 DB. 3초 후 진행...');
    await sleep(3000);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (isEnrich) {
    await enrichEnglishNames(supabase);
  } else {
    const result = await addGlobalIngredients(supabase);

    // 글로벌 재료 추가 후 name_en도 함께 보강
    console.log('\n[글로벌 재료 추가 완료 — name_en 보강도 실행]');
    await enrichEnglishNames(supabase);

    const { data: final } = await supabase
      .from('ingredients_master')
      .select('id', { count: 'exact', head: true });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 최종 결과`);
    console.log('='.repeat(50));
    console.log(`  글로벌 재료 추가: ${result.inserted}개`);
    console.log(`  출처: Open Food Facts (ODbL 라이선스)`);
    console.log('='.repeat(50));
  }
}

main().catch(err => {
  console.error('❌ 스크립트 실패:', err);
  process.exit(1);
});
